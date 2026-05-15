---
name: gen-threads
description: Génère une image pour Threads. Format 1:1 (carré) ou 4:5 (portrait). Threads favorise le contenu authentique, les opinions visuelles, les textes stylisés. Utilise Nano Banana Pro ou Soul 2.0.
arguments:
  - name: influencer
    description: Nom ou soul_id de l'influenceur (optionnel)
  - name: prompt
    description: Description de l'image Threads
  - name: format
    description: "1:1 ou 4:5 — défaut: 1:1"
  - name: style
    description: "photo, graphic, text-visual — défaut: photo"
---

# Génération — Image Threads

## Plateforme
- Réseau : **Threads** (Meta)
- Format : **1:1** (carré, recommandé) ou **4:5** (portrait)
- Qualité : **2k**
- Ton : authentique, direct, opiné — moins "parfait" qu'Instagram

### Modèles selon le style
| Style | Modèle | Pourquoi |
|-------|--------|----------|
| Portrait influenceur | `soul_2` | Réaliste, UGC authentique |
| Photo lifestyle | `nano_banana_2` | Qualité maximale |
| Visuel texte/citation | `gpt_image_2` | Meilleur rendu texte |
| Rapide | `nano_banana_flash` | Preview économique |

---

## ÉTAPE 1 — Style du post Threads

Si `$style` fourni, utilise-le.
Sinon demande :
```
Quel style pour le post Threads ?
1. photo      → Photo lifestyle de l'influenceur
2. graphic    → Visuel graphique, citation, opinion
3. text-visual → Image avec texte intégré (ex: stat, quote)
```

---

## ÉTAPE 2 — Format

Si `$format` fourni, utilise-le.
Sinon :
- Style photo → propose **4:5** (plus impactant)
- Style graphic/text → propose **1:1** (plus partageable)

---

## ÉTAPE 3 — Prompt selon le style

**Style photo :**
Demande : "Décris le contexte de la photo (ex: 'influenceur en train de lire dans un café, ambiance chill, lumière chaude')"
Enrichis avec : candid, authentic, warm atmosphere, real moment

**Style graphic :**
Demande : "Quel message ou thème ? (ex: 'minimaliste sur fond beige, ambiance clean aesthetic')"
Enrichis avec : clean design, minimal, bold typography if text

**Style text-visual :**
Demande : "Quel est le texte à afficher et le contexte ?"
Utilise `gpt_image_2` pour meilleur rendu texte

---

## ÉTAPE 4 — Identifier l'influenceur

Si `$influencer` fourni et style = photo :
- Recherche soul_id via `show_characters(action='list', status='ready')`
- Si trouvé → `soul_2` avec soul_id
- Si non trouvé → `nano_banana_2`

---

## ÉTAPE 5 — Génération

**Photo avec influenceur :**
- model: `soul_2`
- aspect_ratio: [format]
- quality: `2k`
- soul_id: [si disponible]
- count: 2

**Photo sans personnage / lifestyle :**
- model: `nano_banana_2`
- aspect_ratio: [format]
- resolution: `2k`
- count: 2

**Texte / Graphique :**
- model: `gpt_image_2`
- aspect_ratio: [format]
- quality: `medium`
- count: 2

---

## ÉTAPE 6 — Résumé

```
✅ Image Threads générée
📐 Format : [ratio]
🎨 Style : [style]
👤 Influenceur : [nom ou "Aucun"]
💡 Tip : Threads = authenticité. Évite les images trop parfaites, préfère le naturel.
```
