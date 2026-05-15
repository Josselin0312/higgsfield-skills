---
name: gen-instagram-feed
description: Génère une image pour le feed Instagram d'un influenceur. Format 4:5 (portrait) ou 1:1 (carré). Utilise Soul 2.0 si un soul_id est disponible, sinon Nano Banana Pro. Qualité 2k par défaut.
arguments:
  - name: influencer
    description: Nom ou soul_id de l'influenceur (optionnel)
  - name: prompt
    description: Description du contenu à générer
  - name: format
    description: "4:5 ou 1:1 (défaut: 4:5)"
---

# Génération — Instagram Feed

## Plateforme
- Réseau : **Instagram Feed**
- Format : **4:5** (portrait, recommandé) ou **1:1** (carré)
- Qualité : **2k**
- Modèle principal : `soul_2` (avec soul_id) ou `nano_banana_2` (sans référence)

---

## ÉTAPE 1 — Identifier l'influenceur

Si `$influencer` est fourni :
- Appelle `show_characters(action='list', status='ready')` pour trouver le `soul_id` correspondant
- Si trouvé → utilise `soul_2` avec le `soul_id`
- Si non trouvé → utilise `nano_banana_2` sans référence

Si aucun influenceur fourni, demande :
> "Pour quel influenceur génères-tu ce contenu ? (ou laisse vide pour générer sans personnage spécifique)"

---

## ÉTAPE 2 — Construire le prompt

Si un prompt est fourni via `$prompt`, utilise-le directement.

Sinon, demande :
> "Décris le contenu de l'image (ex: 'femme souriante dans un café parisien, lumière naturelle, tenue casual chic, ambiance lifestyle')"

**Enrichis toujours le prompt avec :**
- Style : photorealistic, high-end lifestyle photography
- Lumière : natural light / golden hour / soft studio light
- Ambiance : authentic, aspirational
- Qualité : sharp details, Instagram-ready

---

## ÉTAPE 3 — Choisir le format

Si `$format` est spécifié, utilise-le.
Sinon propose :
```
Format souhaité ?
1. 4:5 → Portrait (recommandé Feed, occupe plus d'espace)
2. 1:1 → Carré (classique)
```

---

## ÉTAPE 4 — Génération

**Avec Soul Character (influenceur entraîné) :**
Génère avec `generate_image` :
- model: `soul_2`
- aspect_ratio: [format choisi]
- soul_id: [id trouvé]
- quality: `2k`
- count: 2 (pour avoir le choix)

**Sans référence personnage :**
Génère avec `generate_image` :
- model: `nano_banana_2`
- aspect_ratio: [format choisi]
- resolution: `2k`
- count: 2

---

## ÉTAPE 5 — Résumé post-génération

Affiche :
```
✅ Génération Instagram Feed terminée
📐 Format : [ratio]
👤 Influenceur : [nom ou "Aucun"]
🔢 Nombre d'images : 2
💡 Tip : Utilise /gen-reels pour créer la vidéo Reel à partir de cette image
```
