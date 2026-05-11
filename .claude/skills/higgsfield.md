# Higgsfield — Image & Video Generation Skill

Use this skill when the user wants to generate images or videos, animate characters, create ads or marketing content, or predict video virality using Higgsfield AI.

## Workflow

### 1. Understand the goal

Ask the user (or infer from context):
- **Output type**: image or video?
- **Style/use-case**: portrait, product ad, character, animation, editorial, UGC, 4K diagram…
- **Reference media**: does the user have an image/video to use as a starting point?
- **Aspect ratio** (optional): e.g. `16:9`, `9:16`, `1:1`
- **Duration** (for video only): default is fine unless user specifies

### 2. Choose the right model

Call `models_explore` to pick the best model:

```
models_explore(action="recommend", query="<goal + input context>", type="image"|"video")
```

**Quick defaults** (no need to explore when the use-case is clear):
| Use-case | Model |
|---|---|
| Commercial / product / ads (image) | `marketing_studio_image` |
| Commercial / product / ads (video) | `marketing_studio_video` |
| Portrait / fashion / UGC (image) | `soul_2` |
| Top quality 4K / text / diagrams (image) | `nano_banana_2` |
| Reference-driven video (strong identity) | `seedance_2_0` |
| Multi-shot / audio / motion transfer (video) | `kling3_0` |
| Text-only character / avatar (image) | `soul_cast` |
| Reusable Soul Character (trained) | `soul_2` with `soul_id` |

### 3. Handle reference media (if any)

If the user provides a local file:
1. Call `media_upload` to upload it.
2. Call `media_confirm` with the returned `media_id`.
3. Use the confirmed `media_id` as the `value` in `medias[]`.

If the user provides an `https://` URL, pass it directly as `value`.

### 4. Generate

**Image:**
```
generate_image(params={
  model: "<model_id>",
  prompt: "<description>",
  aspect_ratio: "16:9",          # optional
  count: 1,                       # 1–4
  medias: [{ value: "<id_or_url>", role: "<role>" }]  # if reference
})
```

**Video:**
```
generate_video(params={
  model: "<model_id>",
  prompt: "<description>",
  aspect_ratio: "9:16",          # optional
  duration: 5,                    # seconds, optional
  medias: [{ value: "<id_or_url>", role: "start_image" }]  # if reference
})
```

> Tip: call `models_explore(action="get", model_id="<id>")` to check valid `aspect_ratios`, `durations`, and `medias[].roles` for a specific model.

### 5. Virality prediction (video only)

When the user asks whether a video could go viral, or wants engagement/hook analysis:

```
virality_predictor(action="create", params={
  model: "virality_predictor",
  medias: [{ role: "video", id: "<job_id_or_media_id>" }]
})
```

Use `action="preview"` with an existing `job_id` to re-open an existing dashboard.

---

## Rules

- **Never train a Soul Character** for a generic "create avatar/character" request — use one-off generation (`soul_2` or `soul_cast`). Only train when the user explicitly asks for a **reusable** identity/twin and provides 5–20 reference photos.
- For Marketing Studio video with a **URL**, call `show_marketing_studio(action='fetch')` first, then `generate_video` with `model: marketing_studio_video` and the resulting URL.
- For Marketing Studio video with an **uploaded image**, call `show_marketing_studio(type='product', action='create')` first, then follow the returned `next_step`.
- Hooks/settings (`hook_id`, `setting_id`) are only supported for presets: `UGC`, `Tutorial`, `Unboxing`, `Product Review`, `UGC Virtual Try On`. If the user asks for one but no ID is provided, call `show_marketing_studio(action='list', type='hook'|'setting')` first.
- Check `balance` before launching expensive batch jobs if the user seems concerned about credits.
- Pass model-specific parameters as **top-level fields** inside `params` (not nested).
- The server may return `adjustments` — report them to the user if they affect the output.

---

## Example prompts → actions

| User says | Action |
|---|---|
| "Generate a cinematic portrait of a woman in Paris" | `generate_image` with `soul_2`, aspect `2:3` |
| "Make a 9:16 product ad video for my sneakers" | `generate_video` with `marketing_studio_video` |
| "Animate this photo of me walking on the beach" | upload → `generate_video` with `seedance_2_0`, `start_image` |
| "Will this video go viral?" | `virality_predictor` create |
| "Create a 4K diagram of how photosynthesis works" | `generate_image` with `nano_banana_2` |
| "Make me a reusable avatar from my 10 photos" | `show_characters(action='train')` |
