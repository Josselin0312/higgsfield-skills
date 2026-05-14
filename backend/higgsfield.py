import httpx
import os
from typing import Optional

API_URL = os.getenv("HIGGSFIELD_API_URL", "https://api.higgsfield.ai")
API_KEY = os.getenv("HIGGSFIELD_API_KEY", "")

HEADERS = lambda: {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
}


async def generate_image(
    prompt: str,
    model: str = "soul_2",
    aspect_ratio: str = "9:16",
    count: int = 1,
    medias: Optional[list] = None,
) -> dict:
    payload = {
        "model": model,
        "prompt": prompt,
        "aspect_ratio": aspect_ratio,
        "count": count,
    }
    if medias:
        payload["medias"] = medias

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            f"{API_URL}/v1/image/generate",
            json=payload,
            headers=HEADERS(),
        )
        resp.raise_for_status()
        return resp.json()


async def get_generation_status(job_id: str) -> dict:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"{API_URL}/v1/generations/{job_id}",
            headers=HEADERS(),
        )
        resp.raise_for_status()
        return resp.json()


async def list_models(type_filter: Optional[str] = "image") -> dict:
    params = {}
    if type_filter:
        params["type"] = type_filter
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"{API_URL}/v1/models",
            params=params,
            headers=HEADERS(),
        )
        resp.raise_for_status()
        return resp.json()
