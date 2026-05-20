# IGFlow — Studio IA & CRM Instagram

Plateforme de création de contenu IA et de gestion des DMs pour Instagram.

## Démarrage rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer les variables d'environnement
cp .env.local.example .env.local
# → Remplis ta clé API Anthropic dans .env.local

# 3. Lancer en local
npm run dev
```

Ouvre http://localhost:3000

## Configuration

### Clé API Claude (obligatoire pour les Skills IA)
1. Va sur https://console.anthropic.com/
2. Crée une clé API
3. Colle-la dans `.env.local` : `ANTHROPIC_API_KEY=sk-ant-...`

### Instagram (pour poster directement)
1. Compte Instagram Business ou Creator
2. Page Facebook connectée au compte IG
3. Token d'accès via Meta for Developers

## Modules

- **Dashboard** `/` — Vue d'ensemble
- **Studio** `/studio` — Créer et programmer des posts
- **Skills IA** `/skills` — Workflows IA pour hooks, captions, scripts, DMs
- **CRM DM** `/crm` — Gérer les leads et l'équipe de setters
- **Paramètres** `/settings` — Connexions API et équipe

## Déploiement (Vercel)

```bash
npx vercel
# Ajoute ANTHROPIC_API_KEY dans les variables d'environnement Vercel
```
