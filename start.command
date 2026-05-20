#!/bin/bash
cd "$(dirname "$0")"

echo "🚀 Lancement d'IGFlow..."

# Vérifie Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js n'est pas installé."
  echo "👉 Télécharge-le sur https://nodejs.org (bouton LTS)"
  read -p "Appuie sur Entrée pour fermer..."
  exit 1
fi

# Installe les dépendances si besoin
if [ ! -d "node_modules" ]; then
  echo "📦 Installation des modules (première fois seulement)..."
  npm install
fi

echo "✅ Ouverture de l'app sur http://localhost:3000"
sleep 1
open http://localhost:3000
npm run dev
