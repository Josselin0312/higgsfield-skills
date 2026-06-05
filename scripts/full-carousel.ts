#!/usr/bin/env node
/**
 * Complete Carousel Generation - All in One
 * This runs the full pipeline: analyze → upload → generate
 */

import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error("❌ ANTHROPIC_API_KEY not set");
  process.exit(1);
}

const client = new Anthropic({ apiKey });

async function analyzeInstagramImage(imagePath: string) {
  console.log("📸 Step 1: Analyzing Instagram image...");

  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString("base64");

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: base64Image,
            },
          },
          {
            type: "text",
            text: `Analyse this image in exhaustive JSON detail. Don't exceed 6000 characters. Detail the exact identical situation, the outfit, the facial expressions, the clothes, the accessories. Don't describe the model detail such as the hair color, the eyes color and dont describe the copywriting on the photo.

Return ONLY valid JSON, no other text:
{
  "image_type": "...",
  "composition": {"shot_type": "...", "camera_style": "...", "angle": "...", "framing": "...", "focus_priority": []},
  "scene": {"setting": "...", "environment": {"foreground": [], "midground": [], "background": []}, "lighting": {"type": "...", "quality": "...", "direction": "...", "effect": "..."}, "atmosphere": []},
  "situation": {"apparent_activity": "...", "likely_context": [], "interaction_with_scene": "..."},
  "subject": {"count": 1, "presentation": "...", "placement": "...", "body_orientation": "..."},
  "pose": {"head_position": "...", "shoulders": "...", "neck_posture": "...", "overall_pose_style": []},
  "facial_expression": {"expression_type": "...", "mouth": "...", "eyes": "...", "brows": "...", "emotion_impression": []},
  "outfit": {"overall_style": [], "top": {"type": "...", "fit": "...", "color": "...", "features": [], "style_effect": "..."}},
  "accessories": {"jewelry": [], "other_accessories": []},
  "environmental_details": {"interior_elements": [], "exterior_elements": []},
  "image_reading_summary": {"primary_story": "...", "main_visual_themes": []}
}`,
          },
        ],
      },
    ],
  });

  const analysisText = response.content[0];
  if (analysisText.type !== "text") {
    throw new Error("Unexpected response type");
  }

  return JSON.parse(analysisText.text);
}

function buildPrompt(analysis: any) {
  return `Use the provided images strictly as a reference for the same model (identity, face, body proportions, hair color). The things you need to change are listed here (clothes, place etc) keep the same smile:

${JSON.stringify(analysis, null, 2)}`;
}

async function main() {
  try {
    // Check if image paths are provided via command line
    const instagramImagePath = process.argv[2];
    const headImagePath = process.argv[3];
    const bodyImagePath = process.argv[4];

    if (!instagramImagePath || !headImagePath || !bodyImagePath) {
      console.error(
        "Usage: npx ts-node scripts/full-carousel.ts <instagram-image> <head-image> <body-image>"
      );
      process.exit(1);
    }

    // Verify files exist
    [instagramImagePath, headImagePath, bodyImagePath].forEach((p) => {
      if (!fs.existsSync(p)) {
        console.error(`❌ File not found: ${p}`);
        process.exit(1);
      }
    });

    console.log("🎨 Carousel Automation - Full Pipeline");
    console.log("=====================================\n");

    // Step 1: Analyze
    const analysis = await analyzeInstagramImage(instagramImagePath);
    console.log("✅ Analysis complete!\n");

    // Step 2: Build prompt
    const prompt = buildPrompt(analysis);
    console.log("📝 Prompt built\n");

    // Step 3: Output everything
    console.log("🎯 NEXT STEPS FOR HIGGSFIELD:\n");
    console.log("1. Go to Higgsfield");
    console.log("2. Upload head image (reference identity)");
    console.log("3. Upload body image (reference body)");
    console.log("4. Paste this prompt:\n");
    console.log("---START PROMPT---");
    console.log(prompt);
    console.log("---END PROMPT---\n");
    console.log("5. Generate with:");
    console.log("   - Model: nano_banana_pro");
    console.log("   - Aspect Ratio: 9:16");
    console.log("   - Quality: 2k\n");

    console.log("✅ Ready! Copy the prompt above and go to Higgsfield");
  } catch (error) {
    console.error(
      "❌ Error:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

main();
