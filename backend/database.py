import aiosqlite
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "data.db")


async def get_db():
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        yield db
    finally:
        await db.close()


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executescript("""
            CREATE TABLE IF NOT EXISTS influencers (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                name        TEXT NOT NULL UNIQUE,
                handle      TEXT,
                niche       TEXT,
                style_notes TEXT,
                avatar_url  TEXT,
                created_at  TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS generations (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                influencer_id INTEGER NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
                job_id        TEXT,
                prompt        TEXT NOT NULL,
                model         TEXT NOT NULL DEFAULT 'soul_2',
                aspect_ratio  TEXT DEFAULT '9:16',
                count         INTEGER DEFAULT 1,
                status        TEXT DEFAULT 'pending',
                image_urls    TEXT DEFAULT '[]',
                error         TEXT,
                created_at    TEXT DEFAULT (datetime('now')),
                updated_at    TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS bulk_jobs (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                influencer_id INTEGER NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
                name          TEXT,
                total         INTEGER DEFAULT 0,
                done          INTEGER DEFAULT 0,
                failed        INTEGER DEFAULT 0,
                status        TEXT DEFAULT 'running',
                created_at    TEXT DEFAULT (datetime('now'))
            );
        """)
        await db.commit()
