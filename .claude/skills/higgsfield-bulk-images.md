# Higgsfield — Bulk Image Generation Skill

Use this skill when the user wants to generate multiple images at once — variations of a concept, a batch of product shots, a series of character styles, etc.

## Key constraint

`generate_image` accepts `count: 1–4` per call. For batches larger than 4, make **multiple parallel calls** and aggregate results.

---

## Workflow

### 1. Clarify the batch

Gather (or infer) before starting:
- **How many images?** (if unspecified, default to 4)
- **Common prompt or per-image prompts?** (one shared description vs. a list of variations)
- **Reference image?** (shared across all, or per-image)
- **Model** (see defaults below)
- **Aspect ratio** (shared across all unless specified per-image)

### 2. Check balance (for large batches)

For batches of 10+ images, call `balance` first and inform the user of their current credits before proceeding.

### 3. Choose a model

| Use-case | Model |
|---|---|
| Product / commercial | `marketing_studio_image` |
| Portrait / fashion / UGC | `soul_2` |
| Top quality 4K / diagrams / text | `nano_banana_2` |
| Text-only character / avatar | `soul_cast` |
| Reusable Soul (already trained) | `soul_2` + `soul_id` |

Call `models_explore(action="recommend", query="<goal>", type="image")` when uncertain.

### 4. Upload shared reference (if any)

If the user provides a local file used for all images:
1. `media_upload` → get `media_id`
2. `media_confirm` → confirm it
3. Reuse that `media_id` in every `generate_image` call

### 5. Split into batches of ≤ 4 and call in parallel

**Formula:** `ceil(total / 4)` calls, each with `count` up to 4.

Examples:
- 4 images → 1 call with `count: 4`
- 6 images → 1 call `count: 4` + 1 call `count: 2`
- 12 images → 3 calls with `count: 4`

**Single prompt, multiple variations:**
```
generate_image(params={
  model: "<model_id>",
  prompt: "<shared prompt>",
  aspect_ratio: "1:1",
  count: 4
})
// repeat as needed
```

**Per-image prompts (variations):**
Run one call per distinct prompt (or group prompts that share an aspect ratio).

### 6. Present results

After all calls complete:
- Use `job_display` to show each batch result.
- Summarize: total requested, total generated, any `adjustments` returned by the server.
- If a call failed, report which batch and why, then offer to retry.

---

## Variation strategies

When the user wants variety from a single concept, diversify across calls by rotating:

| Axis | Examples |
|---|---|
| Lighting | golden hour, studio, overcast, neon |
| Angle | front, 3/4, close-up, wide |
| Style | photorealistic, cinematic, editorial, flat lay |
| Color palette | warm tones, monochrome, pastel, bold |
| Background | white studio, urban, nature, abstract |

Append variation keywords to the base prompt per call rather than repeating identical prompts.

---

## Rules

- **Never train a Soul Character** unless the user explicitly asks for a reusable identity and provides 5–20 reference photos.
- Pass model-specific parameters as **top-level fields** inside `params`.
- Report `adjustments` from the server — they signal that a parameter was changed or ignored.
- For 20+ images, warn the user about credit consumption and confirm before starting.
- Do not use `count: 4` if the user asked for fewer; match `count` exactly to avoid waste.

---

## Example interactions

| User says | Action |
|---|---|
| "Generate 8 product shots of my sneaker" | upload reference → 2× `generate_image` count 4, vary angle/lighting |
| "Give me 12 portrait variations of this character" | 3× `generate_image` count 4, vary style/background/lighting |
| "Create 5 4K banner images for my app" | `nano_banana_2`, 1× count 4 + 1× count 1 |
| "Make 20 UGC-style images from this photo" | check balance → 5× `generate_image` count 4 with `soul_2` |
| "Generate 3 versions of this product on white background" | 1× `generate_image` count 3 with `marketing_studio_image` |
