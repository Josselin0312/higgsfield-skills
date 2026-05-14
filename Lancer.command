#!/bin/bash
# ─────────────────────────────────────────
#  Double-clique sur ce fichier pour lancer
#  l'app Higgsfield Influencer Generator
# ─────────────────────────────────────────

cd "$(dirname "$0")"

# Vérifie Python 3
if ! command -v python3 &>/dev/null; then
  osascript -e 'display alert "Python 3 requis" message "Installe Python 3 depuis python.org puis relance."'
  exit 1
fi

# Installe les dépendances si besoin
python3 -m pip install -q fastapi uvicorn httpx python-dotenv aiosqlite python-multipart 2>/dev/null

# Crée le .env si absent
if [ ! -f .env ]; then
  cp .env.example .env
fi

# Ouvre le navigateur après 2 secondes
(sleep 2 && open http://localhost:8000) &

# Lance le serveur
echo ""
echo "  ✦ Higgsfield — Influencer Generator"
echo "  → http://localhost:8000"
echo "  → Ferme cette fenêtre pour arrêter l'app"
echo ""

cd backend
python3 -m uvicorn main:app --host 127.0.0.1 --port 8000
