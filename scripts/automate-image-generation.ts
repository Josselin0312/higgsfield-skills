#!/usr/bin/env node
import {
  analyzeImageAndGeneratePrompts,
  createHiggsFieldInstructions,
  formatPromptsForDisplay,
} from "../src/lib/image-automation";

interface CliArgs {
  imageUrl: string;
  styles: string[];
  output?: string;
}

function parseArgs(args: string[]): CliArgs {
  const result: CliArgs = {
    imageUrl: "",
    styles: [],
    output: "json",
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--image" || arg === "-i") {
      result.imageUrl = args[++i];
    } else if (arg === "--styles" || arg === "-s") {
      result.styles = args[++i].split(",").map((s) => s.trim());
    } else if (arg === "--output" || arg === "-o") {
      result.output = args[++i];
    }
  }

  return result;
}

function validateArgs(args: CliArgs): boolean {
  if (!args.imageUrl) {
    console.error("❌ Erreur: --image est obligatoire");
    console.error("Usage: ts-node automate-image-generation.ts --image <url> --styles <style1,style2>");
    return false;
  }

  if (args.styles.length === 0) {
    console.error("❌ Erreur: au moins un style est nécessaire");
    console.error("Usage: ts-node automate-image-generation.ts --image <url> --styles <style1,style2>");
    return false;
  }

  return true;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!validateArgs(args)) {
    process.exit(1);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("❌ ANTHROPIC_API_KEY non définie dans les variables d'environnement");
    process.exit(1);
  }

  console.log("🚀 Automatisation de génération d'images");
  console.log(`📸 Image: ${args.imageUrl}`);
  console.log(`🎨 Styles: ${args.styles.join(", ")}`);
  console.log("⏳ Analyse en cours...\n");

  try {
    const analysis = await analyzeImageAndGeneratePrompts(
      args.imageUrl,
      args.styles,
      apiKey
    );

    if (args.output === "json") {
      console.log("✅ Analyse complétée!\n");
      console.log(JSON.stringify(analysis, null, 2));
    } else if (args.output === "markdown") {
      const formatted = formatPromptsForDisplay(analysis);
      console.log(formatted);
    } else if (args.output === "higgsfield") {
      const instructions = createHiggsFieldInstructions(analysis);
      console.log(instructions);
    } else {
      console.log("❌ Format de sortie invalide (json, markdown, ou higgsfield)");
      process.exit(1);
    }

    console.log("\n✅ Succès!");
    console.log(`📊 ${analysis.prompts.length} prompts générés`);
  } catch (error) {
    console.error("❌ Erreur:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
