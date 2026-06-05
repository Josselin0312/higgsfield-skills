#!/usr/bin/env node
/**
 * Carousel Automation CLI
 *
 * Usage:
 *   npx ts-node scripts/carousel.ts --instagram <url> --head <url> --body <url>
 */

import {
  analyzeInstagramImage,
  buildHiggsFieldPrompt,
  DEFAULT_CAROUSEL_CONFIG,
} from "../src/lib/carousel-automation";
import {
  formatHiggsFieldInstructions,
  createCarouselSession,
  exportCarouselConfig,
  formatVariationPrompt,
  generateCarouselPlan,
} from "../src/lib/higgsfield-orchestrator";

interface CliArgs {
  instagramUrl?: string;
  headUrl?: string;
  bodyUrl?: string;
  analyze?: boolean;
  format?: "json" | "markdown" | "instructions";
  variations?: string;
  outputFile?: string;
}

function parseArgs(args: string[]): CliArgs {
  const result: CliArgs = {
    format: "instructions",
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--instagram" || arg === "-i") {
      result.instagramUrl = args[++i];
    } else if (arg === "--head") {
      result.headUrl = args[++i];
    } else if (arg === "--body") {
      result.bodyUrl = args[++i];
    } else if (arg === "--analyze") {
      result.analyze = true;
    } else if (arg === "--format" || arg === "-f") {
      result.format = args[++i] as "json" | "markdown" | "instructions";
    } else if (arg === "--variations" || arg === "-v") {
      result.variations = args[++i];
    } else if (arg === "--output" || arg === "-o") {
      result.outputFile = args[++i];
    }
  }

  return result;
}

function validateArgs(args: CliArgs): { valid: boolean; message?: string } {
  if (!args.instagramUrl) {
    return { valid: false, message: "--instagram <url> is required" };
  }
  if (!args.headUrl) {
    return { valid: false, message: "--head <url> is required" };
  }
  if (!args.bodyUrl) {
    return { valid: false, message: "--body <url> is required" };
  }
  return { valid: true };
}

function parseVariations(variationsStr?: string) {
  if (!variationsStr) return [];

  return variationsStr.split(";").map((v) => {
    const [variation, description] = v.split(":").map((s) => s.trim());
    return { variation, description: description || variation };
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const validation = validateArgs(args);
  if (!validation.valid) {
    console.error(`❌ ${validation.message}`);
    console.error("\nUsage:");
    console.error(
      "  npx ts-node scripts/carousel.ts --instagram <url> --head <url> --body <url>"
    );
    console.error("\nOptions:");
    console.error("  --instagram <url>  Instagram image URL");
    console.error("  --head <url>       Head reference image URL");
    console.error("  --body <url>       Body reference image URL");
    console.error("  --format           Output format (instructions|json|markdown)");
    console.error(
      "  --variations <str> Variations (format: 'prompt:desc;prompt:desc')"
    );
    console.error("  --output <file>    Save output to file");
    process.exit(1);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("❌ ANTHROPIC_API_KEY not set");
    process.exit(1);
  }

  console.log("🚀 Carousel Automation");
  console.log(`📸 Instagram: ${args.instagramUrl}`);
  console.log(`👤 Head: ${args.headUrl}`);
  console.log(`💪 Body: ${args.bodyUrl}`);
  console.log("⏳ Analyzing image...\n");

  try {
    // Analyser l'image
    const analysis = await analyzeInstagramImage(args.instagramUrl!, apiKey);
    console.log("✅ Image analyzed\n");

    // Créer la session
    const session = createCarouselSession(
      analysis,
      args.headUrl!,
      args.bodyUrl!
    );

    // Parser les variations
    const variations = parseVariations(args.variations);

    let output = "";

    if (args.format === "instructions") {
      output = formatHiggsFieldInstructions(
        analysis,
        args.headUrl!,
        args.bodyUrl!
      );

      if (variations.length > 0) {
        output += "\n\n" + generateCarouselPlan(variations);
      }
    } else if (args.format === "json") {
      const config = exportCarouselConfig(session, variations);
      output = JSON.stringify(config, null, 2);
    } else if (args.format === "markdown") {
      output = formatHiggsFieldInstructions(
        analysis,
        args.headUrl!,
        args.bodyUrl!
      );
      if (variations.length > 0) {
        output += "\n\n" + generateCarouselPlan(variations);
      }
    }

    console.log(output);

    if (args.outputFile) {
      const fs = await import("fs/promises");
      await fs.writeFile(args.outputFile, output);
      console.log(`\n✅ Output saved to ${args.outputFile}`);
    }

    console.log("\n✅ Complete! Use the instructions above with Higgsfield");
  } catch (error) {
    console.error(
      "❌ Error:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

main();
