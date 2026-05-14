#!/bin/bash
# ─────────────────────────────────────────────────────────
#  Influencer Content Studio — Lanceur Mac
#  Double-clique sur ce fichier pour démarrer l'app
# ─────────────────────────────────────────────────────────

cd "$(dirname "$0")"

echo ""
echo "  ✨ Influencer Content Studio"
echo "  ─────────────────────────────"

# Vérifie que Node.js est installé
if ! command -v node &> /dev/null; then
  echo ""
  echo "  ❌ Node.js n'est pas installé."
  echo "  → Télécharge-le sur : https://nodejs.org"
  echo ""
  read -p "  Appuie sur Entrée pour fermer..."
  exit 1
fi

echo "  ✓ Node.js $(node --version) détecté"

# Installe les dépendances si besoin (une seule fois)
if [ ! -d "node_modules" ]; then
  echo ""
  echo "  📦 Installation des modules (une seule fois, ~30 sec)..."
  npm install --silent
  echo "  ✓ Installation terminée"
fi

echo ""
echo "  🚀 Démarrage en cours..."
echo "  → L'app va s'ouvrir dans ton navigateur"
echo ""
echo "  (garde cette fenêtre ouverte pendant que tu travailles)"
echo "  (ferme-la pour arrêter l'app)"
echo ""

node server.js
