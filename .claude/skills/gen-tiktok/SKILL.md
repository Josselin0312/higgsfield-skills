---
name: gen-tiktok
description: Génère une vidéo pour TikTok. Format 9:16 vertical, optimisé pour l'engagement TikTok. Utilise Seedance 2.0 pour les personnages ou Kling 3.0 pour le multi-shot avec audio. Marketing Studio pour les ads.
arguments:
  - name: influencer
    description: Nom ou soul_id de l'influenceur (optionnel)
  - name: prompt
    description: Description de la vidéo TikTok
  - name: type
    description: "ugc, trend, ad — défaut: ugc"
  - name: duration
    description: Durée en secondes (5, 8, 10, 15 — défaut 10)
  - name: start_image
    description: Job ID ou URL d'une image de départ (optionnel)
---

# Génération — Vidéo TikTok

## Plateforme
- Réseau : **TikTok**
- Format : **9:16** vertical
- Durée : **10s** par défaut (5/8/10/15s)
- Résolution : **1080p**

### Modèles selon le type
| Type | Modèle | Pourquoi |
|------|--------|----------|
| UGC authentique | `seedance_2_0` | Identité cohérente, image de référence |
| Trend / créatif | `kling3_0` | Multi-shot, audio sync, motion transfer |
| Pub produit TikTok | `marketing_studio_video` | TikTok/Reels prêt à publier |
| Cinématique | `cinematic_studio_3_0` | Qualité premium |
| Rapide / draft | `veo3_1_lite` | Économique, preview rapide |

---

## ÉTAPE 1 — Type de contenu TikTok

Si `$type` fourni, utilise-le.
Sinon demande :
```
Type de vidéo TikTok ?
1. ugc    → Contenu authentique (routine, lifestyle, opinion, GRWM…)
2. trend  → Trending format (transition, multi-shot, dynamic)
3. ad     → Publicité produit (unboxing, test, promotion)
```

---

## ÉTAPE 2 — Hook (accroche première seconde)

TikTok nécessite un hook fort dans les 1-3 premières secondes.

Demande si pas dans le prompt :
> "Quel est le hook ? La première image/action qui accroche (ex: 'elle se retourne vers la caméra avec une expression surprise', 'gros plan produit avec mouvement rapide')"

---

## ÉTAPE 3 — Image de départ

Si `$start_image` fourni, utilise-le.
Sinon demande :
> "As-tu une image de départ ? (job ID depuis /gen-instagram-feed ou /gen-reels — ou laisse vide)"

Si aucune image et type = ugc → génère une image 9:16 avec `soul_2` ou `nano_banana_2` d'abord.

---

## ÉTAPE 4 — Prompt vidéo TikTok

Si `$prompt` fourni, enrichis-le.
Sinon construit depuis le hook + description.

**Enrichis avec :**
- Hook fort : action immédiate dans les 1-3s
- Format vertical TikTok : cadrage serré, dynamique
- Mouvement : transitions rapides, énergie, eye contact caméra
- Style : authentique, proche, pas sur-produit

---

## ÉTAPE 5 — Génération

**Type UGC :**
- model: `seedance_2_0`
- aspect_ratio: `9:16`
- resolution: `1080p`
- duration: [durée]
- genre: `auto`
- medias: [start_image avec role `start_image` si disponible]

**Type Trend (multi-shot) :**
- model: `kling3_0`
- aspect_ratio: `9:16`
- mode: `std`
- duration: [durée]
- medias: [start_image si disponible]

**Type Ad :**
- model: `marketing_studio_video`
- aspect_ratio: `9:16`
- resolution: `1080p`
- generate_audio: false

---

## ÉTAPE 6 — Résumé

```
✅ Vidéo TikTok générée
📐 Format : 9:16 — 1080p
⏱️  Durée : [durée]s
🎬 Modèle : [modèle]
👤 Influenceur : [nom ou "Aucun"]
💡 Tip : Ce même contenu peut être publié sur Instagram Reels (/gen-video-reel)
```
