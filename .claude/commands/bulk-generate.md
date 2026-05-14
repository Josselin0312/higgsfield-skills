Read the file `prompts.csv` in the current directory.

The file has two columns: `prompt` and `model`.
- `prompt` = the image description
- `model` = the Higgsfield model to use (if empty or missing, use `image_auto`)

For each row (skip the header row):
1. Call `generate_image` with the prompt and model from that row
2. After each generation, tell the user which image just finished (e.g. "✅ Image 1/5 done — [prompt]")
3. If a row has no model, use `image_auto`

Generate all images one by one. When all are done, say "🎉 All done! X images generated."

If the file doesn't exist, tell the user: "❌ I can't find prompts.csv. Please create the file next to this project (see the example in the README)."
