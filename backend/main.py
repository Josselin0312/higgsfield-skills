import json
import asyncio
import os
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import aiosqlite

from database import get_db, init_db, DB_PATH
import higgsfield as hf

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="Higgsfield Studio", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

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

class GenerationCreate(BaseModel):
    prompt: str
    model: str = "soul_2"
    aspect_ratio: str = "9:16"
    count: int = 1
    medias: Optional[list] = None

class BulkCreate(BaseModel):
    prompts: list[str]
    model: str = "soul_2"
    aspect_ratio: str = "9:16"
    count: int = 1
    medias: Optional[list] = None


# ── Influenceurs ──────────────────────────────────────────────────────────────

@app.get("/api/influencers")
async def list_influencers(db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute("""
        SELECT i.*,
          COUNT(g.id) total_generations,
          SUM(CASE WHEN g.status='done' THEN 1 ELSE 0 END) done_generations
        FROM influencers i
        LEFT JOIN generations g ON g.influencer_id = i.id
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


# ── Générations ───────────────────────────────────────────────────────────────

@app.get("/api/influencers/{iid}/generations")
async def list_generations(
    iid: int,
    status: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: aiosqlite.Connection = Depends(get_db),
):
    where, params = "WHERE influencer_id=?", [iid]
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


@app.post("/api/influencers/{iid}/generations", status_code=201)
async def create_generation(
    iid: int,
    body: GenerationCreate,
    bg: BackgroundTasks,
    db: aiosqlite.Connection = Depends(get_db),
):
    async with db.execute("SELECT id FROM influencers WHERE id=?", (iid,)) as cur:
        if not await cur.fetchone():
            raise HTTPException(404, "Influenceur introuvable")
    async with db.execute(
        "INSERT INTO generations (influencer_id, prompt, model, aspect_ratio, count) VALUES (?,?,?,?,?)",
        (iid, body.prompt, body.model, body.aspect_ratio, body.count),
    ) as cur:
        gid = cur.lastrowid
    await db.commit()
    bg.add_task(_run, gid, body)
    async with db.execute("SELECT * FROM generations WHERE id=?", (gid,)) as cur:
        d = dict(await cur.fetchone())
    d["image_urls"] = []
    return d


@app.post("/api/influencers/{iid}/bulk", status_code=201)
async def bulk_generate(
    iid: int,
    body: BulkCreate,
    bg: BackgroundTasks,
    db: aiosqlite.Connection = Depends(get_db),
):
    async with db.execute("SELECT id FROM influencers WHERE id=?", (iid,)) as cur:
        if not await cur.fetchone():
            raise HTTPException(404, "Influenceur introuvable")
    if not body.prompts:
        raise HTTPException(400, "Aucun prompt")

    gids = []
    for prompt in body.prompts:
        async with db.execute(
            "INSERT INTO generations (influencer_id, prompt, model, aspect_ratio, count) VALUES (?,?,?,?,?)",
            (iid, prompt, body.model, body.aspect_ratio, body.count),
        ) as cur:
            gids.append(cur.lastrowid)
    await db.commit()

    for gid, prompt in zip(gids, body.prompts):
        gen = GenerationCreate(
            prompt=prompt, model=body.model,
            aspect_ratio=body.aspect_ratio, count=body.count,
            medias=body.medias,
        )
        bg.add_task(_run, gid, gen)

    return {"total": len(gids), "generation_ids": gids}


# ── Background task ───────────────────────────────────────────────────────────

async def _run(gid: int, body: GenerationCreate):
    async with aiosqlite.connect(DB_PATH) as db:
        try:
            result = await hf.generate_image(
                prompt=body.prompt,
                model=body.model,
                aspect_ratio=body.aspect_ratio,
                count=body.count,
                medias=body.medias,
            )
            job_id = result.get("job_id") or result.get("id") or result.get("generation_id")

            if job_id:
                await db.execute("UPDATE generations SET job_id=?, status='generating' WHERE id=?", (job_id, gid))
                await db.commit()
                for _ in range(60):
                    await asyncio.sleep(5)
                    data = await hf.get_generation_status(job_id)
                    s = data.get("status", "")
                    if s in ("completed", "done", "succeeded"):
                        imgs = data.get("images") or data.get("outputs") or data.get("results") or []
                        urls = [i.get("url") or i for i in imgs if i]
                        await db.execute(
                            "UPDATE generations SET status='done', image_urls=?, updated_at=datetime('now') WHERE id=?",
                            (json.dumps(urls), gid),
                        )
                        await db.commit()
                        return
                    elif s in ("failed", "error"):
                        raise Exception(data.get("error") or "Échec API")
            else:
                imgs = result.get("images") or result.get("outputs") or []
                urls = [i.get("url") or i for i in imgs if i]
                await db.execute(
                    "UPDATE generations SET status='done', image_urls=?, updated_at=datetime('now') WHERE id=?",
                    (json.dumps(urls), gid),
                )
                await db.commit()

        except Exception as e:
            await db.execute(
                "UPDATE generations SET status='failed', error=?, updated_at=datetime('now') WHERE id=?",
                (str(e), gid),
            )
            await db.commit()


# ── Frontend ──────────────────────────────────────────────────────────────────
app.mount("/", StaticFiles(directory=FRONTEND, html=True), name="static")
