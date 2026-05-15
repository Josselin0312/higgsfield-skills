---
name: gen-reels
description: Génère une image cover pour Instagram Reels. Format 9:16 vertical. Utilise Soul 2.0 pour les personnages influenceurs. Cette image sera la miniature/cover du Reel avant la vidéo.
arguments:
  - name: influencer
    description: Nom ou soul_id de l'influenceur (optionnel)
  - name: prompt
    description: Description du visuel cover
---

# Génération — Instagram Reels Cover Image

## Plateforme
- Réseau : **Instagram Reels**
- Type : **Image Cover / Thumbnail**
- Format : **9:16** (vertical obligatoire)
- Qualité : **2k**
- Modèle : `soul_2` (avec soul_id) ou `soul_cinematic` (sans référence, style éditorial)

---

## ÉTAPE 1 — Identifier l'influenceur

Si `$influencer` fourni :
- Recherche le `soul_id` via `show_characters(action='list', status='ready')`
- Si trouvé → `soul_2` avec soul_id
- Si non trouvé → `soul_cinematic` (style cinématique)

Sinon demande :
> "Pour quel influenceur ? (ou vide pour générer sans personnage)"

---

## ÉTAPE 2 — Prompt pour une cover Reel efficace

Si `$prompt` fourni, utilise-le et enrichis-le.

Sinon demande :
> "Quel est le thème du Reel ? (ex: 'routine matinale', 'unboxing produit beauté', 'outfit du jour', 'recette healthy')"

**Enrichis le prompt avec :**
- Cadrage : vertical full body ou upper body (adapté 9:16)
- Style : authentic UGC, lifestyle, high engagement thumbnail
- Expression : engaging, eye contact with camera, dynamic pose
- Accroche visuelle : bold colors ou texte visuel suggestif si pertinent

---

## ÉTAPE 3 — Génération cover

Génère avec `generate_image` :
- model: `soul_2` ou `soul_cinematic`
- aspect_ratio: `9:16`
- quality: `2k`
- count: 2

---

## ÉTAPE 4 — Résumé

```
✅ Cover Reels générée
📐 Format : 9:16
👤 Influenceur : [nom]
💡 Tip : Utilise /gen-video-reel pour créer la vidéo Reel à partir de cette cover
```
