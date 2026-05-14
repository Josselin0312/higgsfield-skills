import httpx
import os
import json
from typing import Optional

API_URL = os.getenv("HIGGSFIELD_API_URL", "https://api.higgsfield.ai")
API_KEY = os.getenv("HIGGSFIELD_API_KEY", "")


def _headers():
    return {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }


async def generate_image(
    prompt: str,
    model: str = "soul_2",
    aspect_ratio: str = "9:16",
    count: int = 1,
    medias: Optional[list] = None,
    soul_id: Optional[str] = None,
) -> dict:
    payload = {
        "model": model,
        "prompt": prompt,
        "aspect_ratio": aspect_ratio,
        "count": count,
    }
    if soul_id:
        payload["soul_id"] = soul_id
    if medias:
        payload["medias"] = medias

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            f"{API_URL}/v1/image/generate",
            json=payload,
            headers=_headers(),
        )
        resp.raise_for_status()
        return resp.json()


async def get_generation_status(job_id: str) -> dict:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"{API_URL}/v1/generations/{job_id}",
            headers=_headers(),
        )
        resp.raise_for_status()
        return resp.json()


async def get_upload_url(filename: str, content_type: str = "image/jpeg") -> dict:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{API_URL}/v1/media/upload-url",
            json={"filename": filename, "content_type": content_type},
            headers=_headers(),
        )
        resp.raise_for_status()
        return resp.json()


async def confirm_media(media_id: str) -> dict:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{API_URL}/v1/media/confirm",
            json={"media_id": media_id, "type": "image"},
            headers=_headers(),
        )
        resp.raise_for_status()
        return resp.json()


async def train_soul(name: str, media_ids: list[str]) -> dict:
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            f"{API_URL}/v1/souls/train",
            json={"name": name, "images": media_ids},
            headers=_headers(),
        )
        resp.raise_for_status()
        return resp.json()


async def get_soul_status(soul_id: str) -> dict:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"{API_URL}/v1/souls/{soul_id}",
            headers=_headers(),
        )
        resp.raise_for_status()
        return resp.json()


def json_to_prompt(data: dict) -> str:
    """Convertit un JSON Claude en prompt texte pour Higgsfield."""
    parts = []

    # Type d'image
    if t := data.get("image_type"):
        parts.append(t)

    # Shot et composition
    comp = data.get("composition", {})
    if s := comp.get("shot_type"):
        parts.append(s)
    if a := comp.get("angle"):
        parts.append(f"angle: {a}")

    # Scène et lieu
    scene = data.get("scene", {})
    if setting := scene.get("setting"):
        parts.append(f"setting: {setting}")

    lighting = scene.get("lighting", {})
    if lt := lighting.get("type"):
        parts.append(f"{lt} lighting")
    if le := lighting.get("effect"):
        parts.append(le)

    atmo = scene.get("atmosphere", [])
    if atmo:
        parts.append(", ".join(atmo[:3]) + " atmosphere")

    # Pose
    pose = data.get("pose", {})
    if hp := pose.get("head_position"):
        parts.append(hp)
    if ps := pose.get("overall_pose_style"):
        parts.append(", ".join(ps[:2]) + " pose")

    # Expression
    face = data.get("facial_expression", {})
    if ft := face.get("expression_type"):
        parts.append(ft)
    if ei := face.get("emotion_impression"):
        parts.append(", ".join(ei[:2]))

    # Apparence
    app = data.get("appearance", {})
    makeup = app.get("makeup_impression", [])
    if makeup:
        parts.append(", ".join(makeup[:3]))
    hair = app.get("hair", {})
    if hs := hair.get("style"):
        parts.append(f"{hs} hair")

    # Tenue
    outfit = data.get("outfit", {})
    top = outfit.get("top", {})
    if tc := top.get("color"):
        parts.append(f"{tc} {top.get('type', 'top')}")

    # Qualité
    parts.append("photorealistic, ultra realistic, 8k, high quality, social media photo")

    return ". ".join(p.strip() for p in parts if p.strip())
