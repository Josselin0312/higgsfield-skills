#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'crm-data.json');

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    return { revenue: { total: 0, by_skill: {} }, generations: { total: 0 }, history: [] };
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function displayDashboard() {
  const data = loadData();

  console.clear();
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    🎨 CRM SKILLS HUB v1.0                      ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  📊 REVENUE ANALYTICS                                          ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   ║
║                                                                ║
║    Total Revenue:          $${data.revenue.total.toFixed(2).padEnd(10)}                       ║
║    Total Generations:      ${data.generations.total.toString().padEnd(10)}                ║
║    Images Generated:       ${data.generations.image.toString().padEnd(10)}                ║
║    Videos Generated:       ${data.generations.video.toString().padEnd(10)}                ║
║                                                                ║
║  💰 BY SKILL                                                   ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   ║
║                                                                ║
║    Image Generation:       $${data.revenue.by_skill.generate_image?.toFixed(2) || '0.00'}                ║
║    Video Generation:       $${data.revenue.by_skill.generate_video?.toFixed(2) || '0.00'}                ║
║    Video Analysis:         $${data.revenue.by_skill.video_analysis?.toFixed(2) || '0.00'}                ║
║    Virality Predictor:     $${data.revenue.by_skill.virality_predictor?.toFixed(2) || '0.00'}                ║
║                                                                ║
╠════════════════════════════════════════════════════════════════╣
║                    🚀 AVAILABLE SKILLS                         ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  🖼️  Image Generation                                         ║
║     - Models: nano_banana_2, gpt_image_2, seedream_v5_lite    ║
║     - Status: ✅ Active                                        ║
║                                                                ║
║  🎬 Video Generation                                          ║
║     - Models: kling3_0, seedance_2_0, marketing_studio_video  ║
║     - Status: ✅ Active                                        ║
║                                                                ║
║  📹 Video Analysis                                            ║
║     - Tools: Scene analysis, Virality prediction              ║
║     - Status: ✅ Active                                        ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

  Commands:
    • /crm dashboard     - Afficher ce dashboard
    • /crm revenue       - Détail des revenus
    • /crm generate      - Lancer une génération
    • /crm history       - Voir l'historique
  `);
}

function displayRevenue() {
  const data = loadData();

  console.log(`
╔════════════════════════════════════════════════╗
║            💰 REVENUE BREAKDOWN                ║
╠════════════════════════════════════════════════╣
║                                                ║
║  Total Revenue:        $${data.revenue.total.toFixed(2).padEnd(8)}              ║
║  Total Generations:    ${data.generations.total}                    ║
║  Avg Cost per Gen:     $${(data.revenue.total / (data.generations.total || 1)).toFixed(2)}              ║
║                                                ║
║  By Skill:                                     ║
║  ├─ Image:             $${Object.values(data.revenue.by_skill).reduce((a, b) => a + b, 0).toFixed(2).padEnd(8)}         ║
║  ├─ Video:             $0.00                  ║
║  └─ Analysis:          $0.00                  ║
║                                                ║
╚════════════════════════════════════════════════╝
  `);
}

function displayHistory() {
  const data = loadData();

  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                 📋 GENERATION HISTORY                          ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
`);

  if (data.history.length === 0) {
    console.log("║  No activity yet. Start generating! 🚀                      ║");
  } else {
    data.history.slice(-10).forEach(item => {
      console.log(`║  ${item.timestamp} - ${item.type} (${item.model}) - $${item.cost}           ║`);
    });
  }

  console.log(`║                                                                ║`);
  console.log(`╚════════════════════════════════════════════════════════════════╝`);
}

const command = process.argv[2];

switch (command) {
  case 'dashboard':
    displayDashboard();
    break;
  case 'revenue':
    displayRevenue();
    break;
  case 'history':
    displayHistory();
    break;
  case 'init':
    saveData(loadData());
    console.log('✅ CRM Hub initialized!');
    break;
  default:
    displayDashboard();
}
