import json
import asyncio
import os
from contextlib import asynccontextmanager
from typing import Optional, List

from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import aiosqlite

from database import get_db, init_db, DB_PATH
import higgsfield as hf

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))


# Aspect ratio et nombre d'images par type de contenu
CONTENT_DEFAULTS = {
    "instagram": {"ratio": "4:5",  "min": 3, "max": 4,  "model": "soul_2"},
    "tiktok":    {"ratio": "9:16", "min": 2, "max": 6,  "model": "soul_2"},
    "threads":   {"ratio": "9:16", "min": 2, "max": 6,  "model": "soul_2"},
    "histoire":  {"ratio": "9:16", "min": 4, "max": 10, "model": "soul_2"},
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="Higgsfield Studio", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

FRONTEND = os.path.join(os.path.dirname(__file__), "..", "frontend")


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
    content_type: str          # instagram | tiktok | threads | histoire
    prompt: str
    image_count: Optional[int] = None   # si None → prend le max du type
    model: str = "soul_2"

class BulkPostCreate(BaseModel):
    content_type: str
    prompts: List[str]
    image_count: Optional[int] = None
    model: str = "soul_2"
    name: Optional[str] = None


# ── Influenceurs ──────────────────────────────────────────────────────────────

@app.get("/api/influencers")
async def list_influencers(db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute("""
        SELECT i.*,
          COUNT(DISTINCT p.id) total_posts,
          SUM(CASE WHEN p.status='done' THEN 1 ELSE 0 END) done_posts
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
        raise HTTPException(404, "Introuvable")
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


# ── Posts (carousels) ─────────────────────────────────────────────────────────

@app.get("/api/influencers/{iid}/posts")
async def list_posts(
    iid: int,
    content_type: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: aiosqlite.Connection = Depends(get_db),
):
    where, params = "WHERE influencer_id=?", [iid]
    if content_type:
        where += " AND content_type=?"
        params.append(content_type)
    if status:
        where += " AND status=?"
        params.append(status)
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
    iid: int,
    body: PostCreate,
    bg: BackgroundTasks,
    db: aiosqlite.Connection = Depends(get_db),
):
    async with db.execute("SELECT id FROM influencers WHERE id=?", (iid,)) as cur:
        if not await cur.fetchone():
            raise HTTPException(404, "Influenceur introuvable")

    if body.content_type not in CONTENT_DEFAULTS:
        raise HTTPException(400, f"Type invalide. Choisir parmi: {list(CONTENT_DEFAULTS)}")

    defaults = CONTENT_DEFAULTS[body.content_type]
    count = body.image_count or defaults["max"]
    count = max(defaults["min"], min(defaults["max"], count))

    async with db.execute(
        "INSERT INTO posts (influencer_id, content_type, prompt, image_count) VALUES (?,?,?,?)",
        (iid, body.content_type, body.prompt, count),
    ) as cur:
        pid = cur.lastrowid
    await db.commit()

    bg.add_task(_run_post, pid, body.prompt, body.model, defaults["ratio"], count)

    async with db.execute("SELECT * FROM posts WHERE id=?", (pid,)) as cur:
        d = dict(await cur.fetchone())
    d["image_urls"] = []
    return d


@app.post("/api/influencers/{iid}/posts/bulk", status_code=201)
async def bulk_posts(
    iid: int,
    body: BulkPostCreate,
    bg: BackgroundTasks,
    db: aiosqlite.Connection = Depends(get_db),
):
    async with db.execute("SELECT id FROM influencers WHERE id=?", (iid,)) as cur:
        if not await cur.fetchone():
            raise HTTPException(404, "Influenceur introuvable")

    if body.content_type not in CONTENT_DEFAULTS:
        raise HTTPException(400, f"Type invalide: {list(CONTENT_DEFAULTS)}")

    if not body.prompts:
        raise HTTPException(400, "Aucun prompt")

    defaults = CONTENT_DEFAULTS[body.content_type]
    count = body.image_count or defaults["max"]
    count = max(defaults["min"], min(defaults["max"], count))

    pids = []
    for prompt in body.prompts:
        async with db.execute(
            "INSERT INTO posts (influencer_id, content_type, prompt, image_count) VALUES (?,?,?,?)",
            (iid, body.content_type, prompt, count),
        ) as cur:
            pids.append(cur.lastrowid)
    await db.commit()

    for pid, prompt in zip(pids, body.prompts):
        bg.add_task(_run_post, pid, prompt, body.model, defaults["ratio"], count)

    return {"total": len(pids), "post_ids": pids, "content_type": body.content_type}


# ── Stats par type ────────────────────────────────────────────────────────────

@app.get("/api/influencers/{iid}/stats")
async def get_stats(iid: int, db: aiosqlite.Connection = Depends(get_db)):
    result = {}
    for ct in CONTENT_DEFAULTS:
        async with db.execute(
            "SELECT COUNT(*) total, SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) done FROM posts WHERE influencer_id=? AND content_type=?",
            (iid, ct),
        ) as cur:
            row = dict(await cur.fetchone())
            result[ct] = row
    return result


# ── Background generation ─────────────────────────────────────────────────────

async def _run_post(pid: int, prompt: str, model: str, ratio: str, count: int):
    async with aiosqlite.connect(DB_PATH) as db:
        try:
            result = await hf.generate_image(
                prompt=prompt, model=model, aspect_ratio=ratio, count=count,
            )
            job_id = result.get("job_id") or result.get("id") or result.get("generation_id")

            if job_id:
                await db.execute("UPDATE posts SET status='generating' WHERE id=?", (pid,))
                await db.commit()
                for _ in range(60):
                    await asyncio.sleep(5)
                    data = await hf.get_generation_status(job_id)
                    s = data.get("status", "")
                    if s in ("completed", "done", "succeeded"):
                        imgs = data.get("images") or data.get("outputs") or data.get("results") or []
                        urls = [i.get("url") or i for i in imgs if i]
                        await db.execute(
                            "UPDATE posts SET status='done', image_urls=?, updated_at=datetime('now') WHERE id=?",
                            (json.dumps(urls), pid),
                        )
                        await db.commit()
                        return
                    elif s in ("failed", "error"):
                        raise Exception(data.get("error") or "Échec API")
                raise Exception("Timeout — génération trop longue")
            else:
                imgs = result.get("images") or result.get("outputs") or []
                urls = [i.get("url") or i for i in imgs if i]
                await db.execute(
                    "UPDATE posts SET status='done', image_urls=?, updated_at=datetime('now') WHERE id=?",
                    (json.dumps(urls), pid),
                )
                await db.commit()

        except Exception as e:
            await db.execute(
                "UPDATE posts SET status='failed', error=?, updated_at=datetime('now') WHERE id=?",
                (str(e), pid),
            )
            await db.commit()


# ── Frontend ──────────────────────────────────────────────────────────────────
app.mount("/", StaticFiles(directory=FRONTEND, html=True), name="static")
