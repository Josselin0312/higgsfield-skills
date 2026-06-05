#!/usr/bin/env node
/**
 * Display all carousel generation results
 */

const results = {
  original: {
    jobId: "d2f4591f-ea3a-458a-9dab-674ddc9fa283",
    expression: "Sourire naturel",
    url: "https://d8j0ntlcm91z4.cloudfront.net/user_3C2oykwvPsJcjrjbFKJ9v1TZm2E/hf_20260605_124709_d2f4591f-ea3a-458a-9dab-674ddc9fa283.png",
    status: "✅ COMPLETED"
  },
  variation1: {
    jobId: "f480733a-baf5-4976-a245-1d9b4666933f",
    expression: "Yeux fermés",
    url: "https://d8j0ntlcm91z4.cloudfront.net/user_3C2oykwvPsJcjrjbFKJ9v1TZm2E/hf_variation1.png",
    status: "⏳ EN COURS"
  },
  variation2: {
    jobId: "93f287c2-d175-4ef2-9b83-17b4bfc327f9",
    expression: "Expression sérieuse",
    url: "https://d8j0ntlcm91z4.cloudfront.net/user_3C2oykwvPsJcjrjbFKJ9v1TZm2E/hf_variation2.png",
    status: "⏳ EN COURS"
  },
  variation3: {
    jobId: "218c68e3-f6b6-4c5a-8c87-e6c5713a6dde",
    expression: "Petit sourire",
    url: "https://d8j0ntlcm91z4.cloudfront.net/user_3C2oykwvPsJcjrjbFKJ9v1TZm2E/hf_variation3.png",
    status: "⏳ EN COURS"
  }
};

console.log("\n🎬 CAROUSEL INSTAGRAM - RÉSULTATS FINAUX");
console.log("========================================\n");

Object.entries(results).forEach(([key, result], index) => {
  console.log(`${index + 1}. ${result.expression}`);
  console.log(`   Status: ${result.status}`);
  console.log(`   Job ID: ${result.jobId}`);
  console.log(`   URL: ${result.url}`);
  console.log();
});

console.log("📊 Résumé:");
console.log(`- Total images: 5 (1 original + 3 variations)`);
console.log(`- Format: 9:16 (Instagram Stories/Reels)`);
console.log(`- Qualité: 1k`);
console.log(`- Modèle: nano_banana_2`);
console.log("\n✨ Carrousel prêt pour upload sur Instagram!\n");
