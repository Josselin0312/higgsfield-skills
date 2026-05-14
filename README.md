# Higgsfield — Influencer Image Generator

App web pour générer des images en masse avec Higgsfield, classées par influenceur.

## Fonctionnalités

- **Influenceurs** : création, profil (niche, handle, style notes), suppression
- **Génération simple** : un prompt → 1 à 4 images
- **Génération en masse** : liste de prompts (un par ligne) lancés en parallèle
- **Galerie** : vue images par influenceur, filtre par statut (terminé / en cours / échec)
- **Suivi temps réel** : polling automatique des jobs en cours
- **Modèles** : Soul 2, Nano Banana 2, Marketing Studio Image

## Installation

```bash
# 1. Copie et remplis la clé API
cp .env.example .env
# Édite .env et mets ta HIGGSFIELD_API_KEY

# 2. Lance l'app
chmod +x start.sh
./start.sh
```

App disponible sur **http://localhost:8000**

## Structure

```
├── backend/
│   ├── main.py          # FastAPI — routes API
│   ├── database.py      # SQLite init + helper
│   ├── higgsfield.py    # Client HTTP Higgsfield
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── start.sh
└── .env.example
```

## Variables d'environnement

| Variable              | Description                            | Défaut                        |
|-----------------------|----------------------------------------|-------------------------------|
| `HIGGSFIELD_API_KEY`  | Clé API Higgsfield (obligatoire)       | —                             |
| `HIGGSFIELD_API_URL`  | URL de base de l'API                   | `https://api.higgsfield.ai`   |
