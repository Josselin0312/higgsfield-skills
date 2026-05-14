import aiosqlite
import os

# Stockage permanent en dehors du dossier projet → survit aux mises à jour
DATA_DIR = os.path.expanduser("~/.higgsfield")
os.makedirs(DATA_DIR, exist_ok=True)
DB_PATH = os.path.join(DATA_DIR, "data.db")


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
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                name          TEXT NOT NULL UNIQUE,
                handle        TEXT,
                niche         TEXT,
                style_notes   TEXT,
                soul_id       TEXT,
                soul_status   TEXT DEFAULT 'none',
                created_at    TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS posts (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                influencer_id INTEGER NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
                content_type  TEXT NOT NULL,
                prompt        TEXT NOT NULL,
                image_count   INTEGER DEFAULT 1,
                status        TEXT DEFAULT 'pending',
                validation    TEXT DEFAULT 'pending',
                image_urls    TEXT DEFAULT '[]',
                error         TEXT,
                created_at    TEXT DEFAULT (datetime('now')),
                updated_at    TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS bulk_jobs (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                influencer_id INTEGER NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
                content_type  TEXT NOT NULL,
                name          TEXT,
                total         INTEGER DEFAULT 0,
                done          INTEGER DEFAULT 0,
                failed        INTEGER DEFAULT 0,
                status        TEXT DEFAULT 'running',
                created_at    TEXT DEFAULT (datetime('now'))
            );
        """)
        await db.commit()
