import json
import asyncio
import os
from contextlib import asynccontextmanager
from typing import Optional, List

from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import aiosqlite
import httpx

from database import get_db, init_db, DB_PATH
import higgsfield as hf

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

CONTENT_DEFAULTS = {
    "instagram": {"ratio": "4:5",  "min": 3, "max": 4},
    "tiktok":    {"ratio": "9:16", "min": 2, "max": 6},
    "threads":   {"ratio": "9:16", "min": 2, "max": 6},
    "histoire":  {"ratio": "9:16", "min": 4, "max": 10},
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="Higgsfield Studio", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

FRONTEND = os.path.join(os.path.dirname(__file__), "..", "frontend")
DATA_DIR = os.path.expanduser("~/.higgsfield")
UPLOADS  = os.path.join(DATA_DIR, "uploads")
os.makedirs(UPLOADS, exist_ok=True)


# ── Schemas ───────────────────────────────────────────────────────────────────

class InfluencerCreate(BaseModel):
    name: str
    handle: Optional[str] = None
    niche: Optional[str] = None
    style_notes: Optional[str] = None

class InfluencerUpdate(BaseModel):
    name: Optional[str] = None
    handle: Optional[str] = None
    niche: Optional[str] = None
    style_notes: Optional[str] = None

class PostCreate(BaseModel):
    content_type: str
    prompt: str
    image_count: Optional[int] = None
    model: str = "soul_2"
    use_soul: bool = True

class BulkPostCreate(BaseModel):
    content_type: str
    prompts: List[str]
    image_count: Optional[int] = None
    model: str = "soul_2"
    use_soul: bool = True

class JsonImportCreate(BaseModel):
    content_type: str
    json_prompts: List[dict]   # liste de JSONs Claude
    model: str = "soul_2"
    use_soul: bool = True

class ScriptCreate(BaseModel):
    content_type: str = "histoire"
    frames: List[str]          # ["Image 1: ...", "Image 2: ..."]
    model: str = "soul_2"
    use_soul: bool = True

class ValidationAction(BaseModel):
    action: str   # "approve" | "reject"


# ── Influenceurs ──────────────────────────────────────────────────────────────

@app.get("/api/influencers")
async def list_influencers(db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute("""
        SELECT i.*,
          COUNT(DISTINCT p.id) total_posts,
          SUM(CASE WHEN p.status='done' AND p.validation='approved' THEN 1 ELSE 0 END) approved_posts
        FROM influencers i
        LEFT JOIN posts p ON p.influencer_id = i.id
        GROUP BY i.id ORDER BY i.name
    """) as cur:
        return [dict(r) for r in await cur.fetchall()]


@app.post("/api/influencers", status_code=201)
async def create_influencer(body: InfluencerCreate, db: aiosqlite.Connection = Depends(get_db)):
    try:
        async with db.execute(
            "INSERT INTO influencers (name, handle, niche, style_notes) VALUES (?,?,?,?)",
            (body.name, body.handle, body.niche, body.style_notes),
        ) as cur:
            iid = cur.lastrowid
        await db.commit()
    except aiosqlite.IntegrityError:
        raise HTTPException(409, "Nom déjà utilisé")
    async with db.execute("SELECT * FROM influencers WHERE id=?", (iid,)) as cur:
        return dict(await cur.fetchone())


@app.get("/api/influencers/{iid}")
async def get_influencer(iid: int, db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute("SELECT * FROM influencers WHERE id=?", (iid,)) as cur:
        row = await cur.fetchone()
    if not row:
        raise HTTPException(404)
    return dict(row)


@app.put("/api/influencers/{iid}")
async def update_influencer(iid: int, body: InfluencerUpdate, db: aiosqlite.Connection = Depends(get_db)):
    fields = {k: v for k, v in body.model_dump().items() if v is not None}
    if not fields:
        raise HTTPException(400, "Rien à mettre à jour")
    clause = ", ".join(f"{k}=?" for k in fields)
    await db.execute(f"UPDATE influencers SET {clause} WHERE id=?", [*fields.values(), iid])
    await db.commit()
    async with db.execute("SELECT * FROM influencers WHERE id=?", (iid,)) as cur:
        return dict(await cur.fetchone())


@app.delete("/api/influencers/{iid}", status_code=204)
async def delete_influencer(iid: int, db: aiosqlite.Connection = Depends(get_db)):
    await db.execute("DELETE FROM influencers WHERE id=?", (iid,))
    await db.commit()


# ── Soul Character ────────────────────────────────────────────────────────────

@app.post("/api/influencers/{iid}/soul/upload")
async def upload_soul_photos(
    iid: int,
    face: UploadFile = File(...),
    body_photo: UploadFile = File(...),
    bg: BackgroundTasks = BackgroundTasks(),
    db: aiosqlite.Connection = Depends(get_db),
):
    async with db.execute("SELECT * FROM influencers WHERE id=?", (iid,)) as cur:
        inf = await cur.fetchone()
    if not inf:
        raise HTTPException(404)

    # Sauvegarde locale des photos
    face_path = os.path.join(UPLOADS, f"soul_{iid}_face{os.path.splitext(face.filename)[1]}")
    body_path = os.path.join(UPLOADS, f"soul_{iid}_body{os.path.splitext(body_photo.filename)[1]}")

    with open(face_path, "wb") as f:
        f.write(await face.read())
    with open(body_path, "wb") as f:
        f.write(await body_photo.read())

    await db.execute("UPDATE influencers SET soul_status='uploading' WHERE id=?", (iid,))
    await db.commit()

    bg.add_task(_train_soul, iid, dict(inf)["name"], face_path, body_path)
    return {"status": "uploading", "message": "Entraînement Soul Character lancé (5-10 min)"}


async def _train_soul(iid: int, name: str, face_path: str, body_path: str):
    async with aiosqlite.connect(DB_PATH) as db:
        try:
            media_ids = []
            for path in [face_path, body_path]:
                fname = os.path.basename(path)
                ct = "image/jpeg" if path.lower().endswith((".jpg", ".jpeg")) else "image/png"

                # Obtient l'URL d'upload
                upload_data = await hf.get_upload_url(fname, ct)
                upload_url = upload_data.get("upload_url") or upload_data.get("url")
                media_id   = upload_data.get("media_id") or upload_data.get("id")

                # Upload le fichier
                with open(path, "rb") as f:
                    file_bytes = f.read()
                async with httpx.AsyncClient(timeout=60) as client:
                    await client.put(upload_url, content=file_bytes, headers={"Content-Type": ct})

                # Confirme
                confirm = await hf.confirm_media(media_id)
                media_ids.append(confirm.get("media_id") or media_id)

            # Lance l'entraînement
            result  = await hf.train_soul(name, media_ids)
            soul_id = result.get("soul_id") or result.get("id")

            await db.execute(
                "UPDATE influencers SET soul_id=?, soul_status='training' WHERE id=?",
                (soul_id, iid),
            )
            await db.commit()

            # Poll statut (max 15 min)
            for _ in range(90):
                await asyncio.sleep(10)
                status_data = await hf.get_soul_status(soul_id)
                s = status_data.get("status", "")
                if s in ("ready", "completed", "done"):
                    await db.execute(
                        "UPDATE influencers SET soul_status='ready' WHERE id=?", (iid,)
                    )
                    await db.commit()
                    return
                elif s in ("failed", "error"):
                    raise Exception("Entraînement Soul échoué")

        except Exception as e:
            await db.execute(
                "UPDATE influencers SET soul_status='failed' WHERE id=?", (iid,)
            )
            await db.commit()


@app.get("/api/influencers/{iid}/soul/status")
async def soul_status(iid: int, db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute("SELECT soul_id, soul_status FROM influencers WHERE id=?", (iid,)) as cur:
        row = await cur.fetchone()
    if not row:
        raise HTTPException(404)
    return dict(row)


# ── Posts ─────────────────────────────────────────────────────────────────────

@app.get("/api/influencers/{iid}/posts")
async def list_posts(
    iid: int,
    content_type: Optional[str] = None,
    status: Optional[str] = None,
    validation: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: aiosqlite.Connection = Depends(get_db),
):
    where, params = "WHERE influencer_id=?", [iid]
    if content_type:
        where += " AND content_type=?"; params.append(content_type)
    if status:
        where += " AND status=?"; params.append(status)
    if validation:
        where += " AND validation=?"; params.append(validation)
    async with db.execute(
        f"SELECT * FROM posts {where} ORDER BY created_at DESC LIMIT ? OFFSET ?",
        params + [limit, offset],
    ) as cur:
        rows = await cur.fetchall()
    result = []
    for r in rows:
        d = dict(r)
        d["image_urls"] = json.loads(d["image_urls"] or "[]")
        result.append(d)
    return result


@app.post("/api/influencers/{iid}/posts", status_code=201)
async def create_post(
    iid: int, body: PostCreate,
    bg: BackgroundTasks,
    db: aiosqlite.Connection = Depends(get_db),
):
    async with db.execute("SELECT * FROM influencers WHERE id=?", (iid,)) as cur:
        inf = await cur.fetchone()
    if not inf:
        raise HTTPException(404)
    inf = dict(inf)

    if body.content_type not in CONTENT_DEFAULTS:
        raise HTTPException(400, f"Type invalide")

    defaults = CONTENT_DEFAULTS[body.content_type]
    count = body.image_count or defaults["max"]
    count = max(defaults["min"], min(defaults["max"], count))

    soul_id = inf.get("soul_id") if body.use_soul and inf.get("soul_status") == "ready" else None

    async with db.execute(
        "INSERT INTO posts (influencer_id, content_type, prompt, image_count, validation) VALUES (?,?,?,?,?)",
        (iid, body.content_type, body.prompt, count, "pending"),
    ) as cur:
        pid = cur.lastrowid
    await db.commit()

    bg.add_task(_run_post, pid, body.prompt, body.model, defaults["ratio"], count, soul_id)

    async with db.execute("SELECT * FROM posts WHERE id=?", (pid,)) as cur:
        d = dict(await cur.fetchone())
    d["image_urls"] = []
    return d


@app.post("/api/influencers/{iid}/posts/bulk", status_code=201)
async def bulk_posts(
    iid: int, body: BulkPostCreate,
    bg: BackgroundTasks,
    db: aiosqlite.Connection = Depends(get_db),
):
    async with db.execute("SELECT * FROM influencers WHERE id=?", (iid,)) as cur:
        inf = await cur.fetchone()
    if not inf:
        raise HTTPException(404)
    inf = dict(inf)

    if not body.prompts:
        raise HTTPException(400, "Aucun prompt")

    defaults = CONTENT_DEFAULTS.get(body.content_type, CONTENT_DEFAULTS["tiktok"])
    count = body.image_count or defaults["max"]
    count = max(defaults["min"], min(defaults["max"], count))
    soul_id = inf.get("soul_id") if body.use_soul and inf.get("soul_status") == "ready" else None

    pids = []
    for prompt in body.prompts:
        async with db.execute(
            "INSERT INTO posts (influencer_id, content_type, prompt, image_count, validation) VALUES (?,?,?,?,?)",
            (iid, body.content_type, prompt, count, "pending"),
        ) as cur:
            pids.append(cur.lastrowid)
    await db.commit()

    for pid, prompt in zip(pids, body.prompts):
        bg.add_task(_run_post, pid, prompt, body.model, defaults["ratio"], count, soul_id)

    return {"total": len(pids), "post_ids": pids}


@app.post("/api/influencers/{iid}/posts/import-json", status_code=201)
async def import_json_posts(
    iid: int, body: JsonImportCreate,
    bg: BackgroundTasks,
    db: aiosqlite.Connection = Depends(get_db),
):
    async with db.execute("SELECT * FROM influencers WHERE id=?", (iid,)) as cur:
        inf = await cur.fetchone()
    if not inf:
        raise HTTPException(404)
    inf = dict(inf)

    if not body.json_prompts:
        raise HTTPException(400, "Aucun JSON")

    defaults = CONTENT_DEFAULTS.get(body.content_type, CONTENT_DEFAULTS["instagram"])
    soul_id = inf.get("soul_id") if body.use_soul and inf.get("soul_status") == "ready" else None

    # Chaque JSON = 1 image dans le carousel → on groupe tout en 1 post
    prompts = [hf.json_to_prompt(j) for j in body.json_prompts]
    count = min(len(prompts), defaults["max"])
    combined_prompt = " | ".join(prompts[:count])

    async with db.execute(
        "INSERT INTO posts (influencer_id, content_type, prompt, image_count, validation) VALUES (?,?,?,?,?)",
        (iid, body.content_type, combined_prompt[:500], count, "pending"),
    ) as cur:
        pid = cur.lastrowid
    await db.commit()

    # Génère chaque image séparément pour le carousel
    bg.add_task(_run_json_carousel, pid, prompts[:count], body.model, defaults["ratio"], soul_id)

    async with db.execute("SELECT * FROM posts WHERE id=?", (pid,)) as cur:
        d = dict(await cur.fetchone())
    d["image_urls"] = []
    return d


@app.post("/api/influencers/{iid}/posts/script", status_code=201)
async def create_script_post(
    iid: int, body: ScriptCreate,
    bg: BackgroundTasks,
    db: aiosqlite.Connection = Depends(get_db),
):
    async with db.execute("SELECT * FROM influencers WHERE id=?", (iid,)) as cur:
        inf = await cur.fetchone()
    if not inf:
        raise HTTPException(404)
    inf = dict(inf)

    soul_id = inf.get("soul_id") if body.use_soul and inf.get("soul_status") == "ready" else None
    defaults = CONTENT_DEFAULTS["histoire"]

    async with db.execute(
        "INSERT INTO posts (influencer_id, content_type, prompt, image_count, validation) VALUES (?,?,?,?,?)",
        (iid, body.content_type, body.frames[0][:200], len(body.frames), "pending"),
    ) as cur:
        pid = cur.lastrowid
    await db.commit()

    bg.add_task(_run_json_carousel, pid, body.frames, "soul_2", defaults["ratio"], soul_id)

    async with db.execute("SELECT * FROM posts WHERE id=?", (pid,)) as cur:
        d = dict(await cur.fetchone())
    d["image_urls"] = []
    return d


# ── Validation ────────────────────────────────────────────────────────────────

@app.post("/api/posts/{pid}/validate")
async def validate_post(pid: int, body: ValidationAction, db: aiosqlite.Connection = Depends(get_db)):
    if body.action not in ("approve", "reject"):
        raise HTTPException(400, "Action invalide")
    validation = "approved" if body.action == "approve" else "rejected"
    await db.execute("UPDATE posts SET validation=? WHERE id=?", (validation, pid))
    await db.commit()
    async with db.execute("SELECT * FROM posts WHERE id=?", (pid,)) as cur:
        d = dict(await cur.fetchone())
    d["image_urls"] = json.loads(d["image_urls"] or "[]")
    return d


@app.get("/api/influencers/{iid}/posts/to-validate")
async def posts_to_validate(iid: int, db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute(
        "SELECT * FROM posts WHERE influencer_id=? AND status='done' AND validation='pending' ORDER BY created_at DESC",
        (iid,),
    ) as cur:
        rows = await cur.fetchall()
    result = []
    for r in rows:
        d = dict(r)
        d["image_urls"] = json.loads(d["image_urls"] or "[]")
        result.append(d)
    return result


# ── Stats ─────────────────────────────────────────────────────────────────────

@app.get("/api/influencers/{iid}/stats")
async def get_stats(iid: int, db: aiosqlite.Connection = Depends(get_db)):
    result = {}
    for ct in CONTENT_DEFAULTS:
        async with db.execute(
            """SELECT COUNT(*) total,
               SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) done,
               SUM(CASE WHEN status='done' AND validation='approved' THEN 1 ELSE 0 END) approved,
               SUM(CASE WHEN status='done' AND validation='pending' THEN 1 ELSE 0 END) to_validate
               FROM posts WHERE influencer_id=? AND content_type=?""",
            (iid, ct),
        ) as cur:
            result[ct] = dict(await cur.fetchone())
    return result


# ── Import image externe (drag & drop) ───────────────────────────────────────

@app.post("/api/influencers/{iid}/posts/import-image", status_code=201)
async def import_image(
    iid: int,
    content_type_field: str = Form(...),
    prompt: str = Form(default="Image importée"),
    files: List[UploadFile] = File(...),
    db: aiosqlite.Connection = Depends(get_db),
):
    async with db.execute("SELECT id FROM influencers WHERE id=?", (iid,)) as cur:
        if not await cur.fetchone():
            raise HTTPException(404)

    saved_urls = []
    for f in files:
        ext  = os.path.splitext(f.filename)[1] or ".jpg"
        fname = f"import_{iid}_{int(asyncio.get_event_loop().time()*1000)}{ext}"
        path  = os.path.join(UPLOADS, fname)
        with open(path, "wb") as fp:
            fp.write(await f.read())
        saved_urls.append(f"/uploads/{fname}")

    async with db.execute(
        "INSERT INTO posts (influencer_id, content_type, prompt, image_count, status, validation, image_urls) VALUES (?,?,?,?,?,?,?)",
        (iid, content_type_field, prompt, len(saved_urls), "done", "approved", json.dumps(saved_urls)),
    ) as cur:
        pid = cur.lastrowid
    await db.commit()

    async with db.execute("SELECT * FROM posts WHERE id=?", (pid,)) as cur:
        d = dict(await cur.fetchone())
    d["image_urls"] = saved_urls
    return d


# ── Background tasks ──────────────────────────────────────────────────────────

async def _run_post(pid: int, prompt: str, model: str, ratio: str, count: int, soul_id: Optional[str] = None):
    async with aiosqlite.connect(DB_PATH) as db:
        try:
            result = await hf.generate_image(prompt=prompt, model=model, aspect_ratio=ratio, count=count, soul_id=soul_id)
            await _handle_result(db, pid, result)
        except Exception as e:
            await db.execute("UPDATE posts SET status='failed', error=? WHERE id=?", (str(e), pid))
            await db.commit()


async def _run_json_carousel(pid: int, prompts: list, model: str, ratio: str, soul_id: Optional[str] = None):
    """Génère chaque image séparément et les regroupe dans le même post."""
    all_urls = []
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("UPDATE posts SET status='generating' WHERE id=?", (pid,))
        await db.commit()
        try:
            for prompt in prompts:
                result = await hf.generate_image(prompt=prompt, model=model, aspect_ratio=ratio, count=1, soul_id=soul_id)
                job_id = result.get("job_id") or result.get("id")
                if job_id:
                    for _ in range(60):
                        await asyncio.sleep(5)
                        data = await hf.get_generation_status(job_id)
                        s = data.get("status", "")
                        if s in ("completed", "done", "succeeded"):
                            imgs = data.get("images") or data.get("outputs") or []
                            urls = [i.get("url") or i for i in imgs if i]
                            all_urls.extend(urls)
                            break
                        elif s in ("failed", "error"):
                            break
                else:
                    imgs = result.get("images") or result.get("outputs") or []
                    all_urls.extend([i.get("url") or i for i in imgs if i])

            await db.execute(
                "UPDATE posts SET status='done', image_urls=?, updated_at=datetime('now') WHERE id=?",
                (json.dumps(all_urls), pid),
            )
            await db.commit()
        except Exception as e:
            await db.execute("UPDATE posts SET status='failed', error=? WHERE id=?", (str(e), pid))
            await db.commit()


async def _handle_result(db, pid, result):
    job_id = result.get("job_id") or result.get("id")
    if job_id:
        await db.execute("UPDATE posts SET status='generating' WHERE id=?", (pid,))
        await db.commit()
        for _ in range(60):
            await asyncio.sleep(5)
            data = await hf.get_generation_status(job_id)
            s = data.get("status", "")
            if s in ("completed", "done", "succeeded"):
                imgs = data.get("images") or data.get("outputs") or []
                urls = [i.get("url") or i for i in imgs if i]
                await db.execute(
                    "UPDATE posts SET status='done', image_urls=?, updated_at=datetime('now') WHERE id=?",
                    (json.dumps(urls), pid),
                )
                await db.commit()
                return
            elif s in ("failed", "error"):
                raise Exception(data.get("error") or "Échec API")
        raise Exception("Timeout")
    else:
        imgs = result.get("images") or result.get("outputs") or []
        urls = [i.get("url") or i for i in imgs if i]
        await db.execute(
            "UPDATE posts SET status='done', image_urls=?, updated_at=datetime('now') WHERE id=?",
            (json.dumps(urls), pid),
        )
        await db.commit()


# ── Servir les uploads locaux ─────────────────────────────────────────────────
from fastapi.responses import FileResponse

@app.get("/uploads/{filename}")
async def serve_upload(filename: str):
    path = os.path.join(UPLOADS, filename)
    if not os.path.exists(path):
        raise HTTPException(404)
    return FileResponse(path)


# ── Frontend ──────────────────────────────────────────────────────────────────
app.mount("/", StaticFiles(directory=FRONTEND, html=True), name="static")
