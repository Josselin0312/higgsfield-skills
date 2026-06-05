#!/usr/bin/env node
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function analyzeInstagram() {
  const instagramUrl =
    "https://drive.google.com/file/d/1OpjP3OLpH2F5kh8R6xszZfituuuEel2w/view?usp=drive_link";

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "url",
                url: instagramUrl,
              },
            },
            {
              type: "text",
              text: `Analyse this image in exhaustive JSON detail. Don't exceed 6000 characters. Detail the exact identical situation, the outfit, the facial expressions, the clothes, the accessories. Don't describe the model detail such as the hair color, the eyes color and dont describe the copywriting on the photo.

Return ONLY valid JSON, no markdown, no explanation. Structure:
{
  "setting": "...",
  "lighting": "...",
  "pose": "...",
  "expression": "...",
  "clothing": {...},
  "accessories": [...],
  "background": "...",
  "composition": "..."
}`,
            },
          ],
        },
      ],
    });

    const analysisJson =
      message.content[0].type === "text" ? message.content[0].text : null;
    console.log(analysisJson);
  } catch (error) {
    console.error("Error analyzing image:", error);
    process.exit(1);
  }
}

analyzeInstagram();
