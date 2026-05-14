#!/bin/bash
set -e

cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "Copie de .env.example → .env"
  cp .env.example .env
  echo "  → Remplis HIGGSFIELD_API_KEY dans .env avant de continuer"
fi

cd backend

if [ ! -d venv ]; then
  echo "Création de l'environnement virtuel…"
  python3 -m venv venv
fi

source venv/bin/activate
pip install -q -r requirements.txt

echo ""
echo "  App disponible sur http://localhost:8000"
echo ""

uvicorn main:app --host 0.0.0.0 --port 8000 --reload
