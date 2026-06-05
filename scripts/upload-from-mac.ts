#!/usr/bin/env node
/**
 * Upload files from your Mac to the upload server
 * Usage: npx ts-node scripts/upload-from-mac.ts /Users/you/Downloads/image1.jpg /Users/you/Downloads/image2.png
 */

import fs from "fs";
import path from "path";
import fetch from "node-fetch";

async function uploadFiles(filePaths: string[]) {
  if (filePaths.length === 0) {
    console.error("❌ Erreur: Fournis au moins un chemin de fichier");
    console.error("Usage: npx ts-node scripts/upload-from-mac.ts /path/to/file1 /path/to/file2");
    process.exit(1);
  }

  console.log("🚀 Upload des fichiers...\n");

  const files = [];

  for (const filePath of filePaths) {
    try {
      if (!fs.existsSync(filePath)) {
        console.error(`❌ Fichier non trouvé: ${filePath}`);
        continue;
      }

      const fileBuffer = fs.readFileSync(filePath);
      const base64Data = fileBuffer.toString("base64");
      const filename = path.basename(filePath);

      files.push({
        name: filename,
        data: base64Data,
      });

      console.log(`✅ ${filename} (${fileBuffer.length} bytes)`);
    } catch (error) {
      console.error(`❌ Erreur avec ${filePath}:`, error);
    }
  }

  if (files.length === 0) {
    console.error("❌ Aucun fichier valide");
    process.exit(1);
  }

  // Upload to API
  console.log("\n📤 Envoi à l'API...");

  try {
    const response = await fetch("http://localhost:3000/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ files }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      console.log(`\n✅ ${data.message}`);
      console.log("\n📁 Fichiers uploadés:");
      data.files.forEach((f: any) => {
        console.log(`  • ${f.filename}`);
        console.log(`    URL: ${f.url}`);
      });
    } else {
      console.error("❌ Erreur:", data.error);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'upload:", error);
    process.exit(1);
  }
}

// Get file paths from command line arguments
const args = process.argv.slice(2);
uploadFiles(args);
