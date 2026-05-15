---
name: content-hub
description: Tableau de bord principal de l'agence. Affiche le solde de crédits, les Soul Characters (influenceurs), l'historique des générations récentes, et guide vers le bon skill par plateforme. À utiliser en début de session ou pour avoir une vue d'ensemble.
---

# Tableau de bord — Agence Contenu AI

Lance les actions suivantes dans l'ordre et présente les résultats sous forme de tableau de bord structuré.

## ÉTAPE 1 — Solde & Plan

Appelle `balance` et affiche :
```
💳 Crédits disponibles : [credits]
📦 Plan : [subscription_plan_type]
```

## ÉTAPE 2 — Influenceurs disponibles (Soul Characters)

Appelle `show_characters(action='list', status='ready')` et affiche un tableau :

```
| # | Nom | Soul ID | Statut |
|---|-----|---------|--------|
| 1 | ... | ...     | ✅ Prêt |
```

Si aucun personnage n'est entraîné, affiche :
```
⚠️  Aucun influenceur entraîné. Pour créer un Soul Character :
→ Fournis 5 à 20 photos de l'influenceur
→ Dis : "entraîne un Soul Character pour [NOM]"
```

## ÉTAPE 3 — Générations récentes

Appelle `show_generations(size=12)` et affiche les 12 dernières générations groupées par type :

**Images récentes :** [liste avec modèle + ratio]
**Vidéos récentes :** [liste avec modèle + durée]

## ÉTAPE 4 — Menu de génération

Affiche ce tableau de navigation :

```
┌─────────────────────────────────────────────────────────────┐
│          GÉNÉRATION RAPIDE — Choisis ta plateforme          │
├──────────────────────┬──────────────────────────────────────┤
│ 📸 Instagram Feed    │ /gen-instagram-feed  → Image 4:5/1:1 │
│ 🎬 Instagram Reels   │ /gen-reels           → Cover 9:16    │
│ 🎬 Instagram Reels   │ /gen-video-reel      → Vidéo 9:16    │
│ 🎵 TikTok            │ /gen-tiktok          → Vidéo 9:16    │
│ 💬 Threads           │ /gen-threads         → Image 1:1/4:5 │
└──────────────────────┴──────────────────────────────────────┘
```

Demande ensuite :
> "Quelle plateforme veux-tu cibler et quel est le nom de l'influenceur ?"
