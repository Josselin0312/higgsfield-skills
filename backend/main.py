import json
import asyncio
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import aiosqlite

from database import get_db, init_db
import higgsfield as hf
import os

from dotenv import load_dotenv
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="Influencer Image Generator", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend")


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class InfluencerCreate(BaseModel):
    name: str
    handle: Optional[str] = None
    niche: Optional[str] = None
    style_notes: Optional[str] = None
    avatar_url: Optional[str] = None


class InfluencerUpdate(BaseModel):
    name: Optional[str] = None
    handle: Optional[str] = None
    niche: Optional[str] = None
    style_notes: Optional[str] = None
    avatar_url: Optional[str] = None


class GenerationCreate(BaseModel):
    prompt: str
    model: str = "soul_2"
    aspect_ratio: str = "9:16"
    count: int = 1
    medias: Optional[list] = None


class BulkGenerationCreate(BaseModel):
    name: Optional[str] = None
    prompts: list[str]
    model: str = "soul_2"
    aspect_ratio: str = "9:16"
    count: int = 1
    medias: Optional[list] = None


# ── Influencers ───────────────────────────────────────────────────────────────

@app.get("/api/influencers")
async def list_influencers(db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute("""
        SELECT i.*,
               COUNT(g.id) AS total_generations,
               SUM(CASE WHEN g.status = 'done' THEN 1 ELSE 0 END) AS done_generations
        FROM influencers i
        LEFT JOIN generations g ON g.influencer_id = i.id
        GROUP BY i.id
        ORDER BY i.name
    """) as cur:
        rows = await cur.fetchall()
    return [dict(r) for r in rows]


@app.post("/api/influencers", status_code=201)
async def create_influencer(body: InfluencerCreate, db: aiosqlite.Connection = Depends(get_db)):
    try:
        async with db.execute(
            "INSERT INTO influencers (name, handle, niche, style_notes, avatar_url) VALUES (?,?,?,?,?)",
            (body.name, body.handle, body.niche, body.style_notes, body.avatar_url),
        ) as cur:
            influencer_id = cur.lastrowid
        await db.commit()
    except aiosqlite.IntegrityError:
        raise HTTPException(409, "Un influenceur avec ce nom existe déjà")
    async with db.execute("SELECT * FROM influencers WHERE id=?", (influencer_id,)) as cur:
        row = await cur.fetchone()
    return dict(row)


@app.get("/api/influencers/{influencer_id}")
async def get_influencer(influencer_id: int, db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute("SELECT * FROM influencers WHERE id=?", (influencer_id,)) as cur:
        row = await cur.fetchone()
    if not row:
        raise HTTPException(404, "Influenceur introuvable")
    return dict(row)


@app.put("/api/influencers/{influencer_id}")
async def update_influencer(influencer_id: int, body: InfluencerUpdate, db: aiosqlite.Connection = Depends(get_db)):
    fields = {k: v for k, v in body.model_dump().items() if v is not None}
    if not fields:
        raise HTTPException(400, "Aucun champ à mettre à jour")
    set_clause = ", ".join(f"{k}=?" for k in fields)
    values = list(fields.values()) + [influencer_id]
    await db.execute(f"UPDATE influencers SET {set_clause} WHERE id=?", values)
    await db.commit()
    async with db.execute("SELECT * FROM influencers WHERE id=?", (influencer_id,)) as cur:
        row = await cur.fetchone()
    return dict(row)


@app.delete("/api/influencers/{influencer_id}", status_code=204)
async def delete_influencer(influencer_id: int, db: aiosqlite.Connection = Depends(get_db)):
    await db.execute("DELETE FROM influencers WHERE id=?", (influencer_id,))
    await db.commit()


# ── Generations ───────────────────────────────────────────────────────────────

@app.get("/api/influencers/{influencer_id}/generations")
async def list_generations(
    influencer_id: int,
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: aiosqlite.Connection = Depends(get_db),
):
    where = "WHERE influencer_id=?"
    params: list = [influencer_id]
    if status:
        where += " AND status=?"
        params.append(status)
    async with db.execute(
        f"SELECT * FROM generations {where} ORDER BY created_at DESC LIMIT ? OFFSET ?",
        params + [limit, offset],
    ) as cur:
        rows = await cur.fetchall()
    result = []
    for r in rows:
        d = dict(r)
        d["image_urls"] = json.loads(d["image_urls"] or "[]")
        result.append(d)
    return result


@app.post("/api/influencers/{influencer_id}/generations", status_code=201)
async def create_generation(
    influencer_id: int,
    body: GenerationCreate,
    background_tasks: BackgroundTasks,
    db: aiosqlite.Connection = Depends(get_db),
):
    async with db.execute("SELECT id FROM influencers WHERE id=?", (influencer_id,)) as cur:
        if not await cur.fetchone():
            raise HTTPException(404, "Influenceur introuvable")

    async with db.execute(
        "INSERT INTO generations (influencer_id, prompt, model, aspect_ratio, count, status) VALUES (?,?,?,?,?,?)",
        (influencer_id, body.prompt, body.model, body.aspect_ratio, body.count, "pending"),
    ) as cur:
        gen_id = cur.lastrowid
    await db.commit()

    background_tasks.add_task(_run_generation, gen_id, body)
    async with db.execute("SELECT * FROM generations WHERE id=?", (gen_id,)) as cur:
        row = await cur.fetchone()
    d = dict(row)
    d["image_urls"] = json.loads(d["image_urls"] or "[]")
    return d


async def _run_generation(gen_id: int, body: GenerationCreate):
    async with aiosqlite.connect(hf.__file__.replace("higgsfield.py", "data.db").replace(
        os.path.join(os.path.dirname(__file__), "higgsfield.py"),
        os.path.join(os.path.dirname(__file__), "data.db"),
    )) as db:
        db.row_factory = aiosqlite.Row
        # Fix path
        db_path = os.path.join(os.path.dirname(__file__), "data.db")

    async with aiosqlite.connect(db_path) as db:
        db.row_factory = aiosqlite.Row
        try:
            result = await hf.generate_image(
                prompt=body.prompt,
                model=body.model,
                aspect_ratio=body.aspect_ratio,
                count=body.count,
                medias=body.medias,
            )
            job_id = result.get("job_id") or result.get("id") or result.get("generation_id")
            await db.execute(
                "UPDATE generations SET job_id=?, status=? WHERE id=?",
                (job_id, "generating", gen_id),
            )
            await db.commit()

            # Poll for completion (max 5 minutes)
            if job_id:
                for _ in range(60):
                    await asyncio.sleep(5)
                    status_data = await hf.get_generation_status(job_id)
                    api_status = status_data.get("status", "")
                    if api_status in ("completed", "done", "succeeded"):
                        images = (
                            status_data.get("images") or
                            status_data.get("outputs") or
                            status_data.get("results") or []
                        )
                        urls = [img.get("url") or img for img in images if img]
                        await db.execute(
                            "UPDATE generations SET status='done', image_urls=?, updated_at=datetime('now') WHERE id=?",
                            (json.dumps(urls), gen_id),
                        )
                        await db.commit()
                        return
                    elif api_status in ("failed", "error"):
                        err = status_data.get("error") or "Échec de génération"
                        await db.execute(
                            "UPDATE generations SET status='failed', error=?, updated_at=datetime('now') WHERE id=?",
                            (err, gen_id),
                        )
                        await db.commit()
                        return
            else:
                # Synchronous response with images inline
                images = result.get("images") or result.get("outputs") or []
                urls = [img.get("url") or img for img in images if img]
                await db.execute(
                    "UPDATE generations SET status='done', image_urls=?, updated_at=datetime('now') WHERE id=?",
                    (json.dumps(urls), gen_id),
                )
                await db.commit()

        except Exception as e:
            async with aiosqlite.connect(os.path.join(os.path.dirname(__file__), "data.db")) as db2:
                await db2.execute(
                    "UPDATE generations SET status='failed', error=?, updated_at=datetime('now') WHERE id=?",
                    (str(e), gen_id),
                )
                await db2.commit()


# ── Bulk generation ───────────────────────────────────────────────────────────

@app.post("/api/influencers/{influencer_id}/bulk", status_code=201)
async def bulk_generate(
    influencer_id: int,
    body: BulkGenerationCreate,
    background_tasks: BackgroundTasks,
    db: aiosqlite.Connection = Depends(get_db),
):
    async with db.execute("SELECT id FROM influencers WHERE id=?", (influencer_id,)) as cur:
        if not await cur.fetchone():
            raise HTTPException(404, "Influenceur introuvable")

    if not body.prompts:
        raise HTTPException(400, "Au moins un prompt requis")

    async with db.execute(
        "INSERT INTO bulk_jobs (influencer_id, name, total, status) VALUES (?,?,?,?)",
        (influencer_id, body.name or f"Bulk {len(body.prompts)} images", len(body.prompts), "running"),
    ) as cur:
        bulk_id = cur.lastrowid

    gen_ids = []
    for prompt in body.prompts:
        async with db.execute(
            "INSERT INTO generations (influencer_id, prompt, model, aspect_ratio, count, status) VALUES (?,?,?,?,?,?)",
            (influencer_id, prompt, body.model, body.aspect_ratio, body.count, "pending"),
        ) as cur:
            gen_ids.append(cur.lastrowid)
    await db.commit()

    gen_body = GenerationCreate(
        prompt="",
        model=body.model,
        aspect_ratio=body.aspect_ratio,
        count=body.count,
        medias=body.medias,
    )
    background_tasks.add_task(_run_bulk, bulk_id, gen_ids, body.prompts, gen_body)

    return {"bulk_job_id": bulk_id, "generation_ids": gen_ids, "total": len(gen_ids)}


async def _run_bulk(bulk_id: int, gen_ids: list, prompts: list, base_body: GenerationCreate):
    db_path = os.path.join(os.path.dirname(__file__), "data.db")
    tasks = []
    for gen_id, prompt in zip(gen_ids, prompts):
        body = base_body.model_copy(update={"prompt": prompt})
        tasks.append(_run_generation(gen_id, body))

    results = await asyncio.gather(*tasks, return_exceptions=True)
    done = sum(1 for r in results if not isinstance(r, Exception))
    failed = sum(1 for r in results if isinstance(r, Exception))

    async with aiosqlite.connect(db_path) as db:
        await db.execute(
            "UPDATE bulk_jobs SET done=?, failed=?, status='done' WHERE id=?",
            (done, failed, bulk_id),
        )
        await db.commit()


@app.get("/api/influencers/{influencer_id}/bulk")
async def list_bulk_jobs(influencer_id: int, db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute(
        "SELECT * FROM bulk_jobs WHERE influencer_id=? ORDER BY created_at DESC",
        (influencer_id,),
    ) as cur:
        rows = await cur.fetchall()
    return [dict(r) for r in rows]


@app.get("/api/generations/{gen_id}/refresh")
async def refresh_generation(gen_id: int, db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute("SELECT * FROM generations WHERE id=?", (gen_id,)) as cur:
        row = await cur.fetchone()
    if not row:
        raise HTTPException(404)
    gen = dict(row)
    if gen["job_id"] and gen["status"] == "generating":
        try:
            data = await hf.get_generation_status(gen["job_id"])
            api_status = data.get("status", "")
            if api_status in ("completed", "done", "succeeded"):
                images = data.get("images") or data.get("outputs") or data.get("results") or []
                urls = [img.get("url") or img for img in images if img]
                await db.execute(
                    "UPDATE generations SET status='done', image_urls=?, updated_at=datetime('now') WHERE id=?",
                    (json.dumps(urls), gen_id),
                )
                await db.commit()
        except Exception:
            pass
        async with db.execute("SELECT * FROM generations WHERE id=?", (gen_id,)) as cur:
            row = await cur.fetchone()
        gen = dict(row)
    gen["image_urls"] = json.loads(gen["image_urls"] or "[]")
    return gen


# ── Models ────────────────────────────────────────────────────────────────────

@app.get("/api/models")
async def get_models():
    try:
        return await hf.list_models()
    except Exception as e:
        return {"error": str(e), "models": []}


# ── Frontend ──────────────────────────────────────────────────────────────────

app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
