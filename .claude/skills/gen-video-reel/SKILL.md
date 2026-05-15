---
name: gen-video-reel
description: Génère une vidéo pour Instagram Reels. Format 9:16, durée 5-15s. Utilise Seedance 2.0 pour les personnages (cohérence identité) ou Marketing Studio pour les ads produits prêtes pour les Reels.
arguments:
  - name: influencer
    description: Nom ou soul_id de l'influenceur (optionnel)
  - name: prompt
    description: Description de la vidéo à créer
  - name: type
    description: "ugc (contenu authentique) ou ad (publicité produit) — défaut: ugc"
  - name: start_image
    description: Job ID ou URL d'une image de départ (optionnel, recommandé)
  - name: duration
    description: Durée en secondes (5, 8, 10, 15 — défaut 8)
---

# Génération — Vidéo Instagram Reels

## Plateforme
- Réseau : **Instagram Reels**
- Format : **9:16** vertical
- Durée : **8s** par défaut (5/8/10/15s disponibles)
- Résolution : **1080p**

### Choix du modèle selon le type de contenu
| Type | Modèle | Pourquoi |
|------|--------|----------|
| Contenu UGC influenceur | `seedance_2_0` | Cohérence identité, référence image |
| Publicité produit Reels | `marketing_studio_video` | One-click Reels/TikTok ready |
| Premium cinématique | `cinematic_studio_3_0` | Qualité maximale |
| Budget / test rapide | `veo3_1_lite` | Rapide et abordable |

---

## ÉTAPE 1 — Type de contenu

Si `$type` fourni, utilise-le.
Sinon demande :
```
Quel type de contenu ?
1. ugc    → Contenu authentique influenceur (lifestyle, routine, fashion…)
2. ad     → Publicité produit (unboxing, review, promotion)
3. cinema → Cinématique premium (lookbook, campagne)
```

---

## ÉTAPE 2 — Image de départ (start_image)

Si `$start_image` fourni, utilise-le comme `start_image`.

Sinon demande :
> "As-tu une image de départ pour la vidéo ? (recommandé — colle le job ID d'une génération /gen-reels ou /gen-instagram-feed, ou laisse vide)"

Si aucune image → génère d'abord une cover avec les specs 9:16 via `generate_image` (soul_2 ou nano_banana_2), puis utilise ce job ID comme start_image.

---

## ÉTAPE 3 — Prompt vidéo

Si `$prompt` fourni, enrichis-le.
Sinon demande :
> "Décris le mouvement / l'action de la vidéo (ex: 'elle regarde la caméra en souriant, prend son café, ambiance matinale cosy, mouvement de caméra lent')"

**Enrichis avec :**
- Mouvement caméra : slow zoom in / pan droit / dolly shot
- Action : naturelle et authentique, regarder la caméra, interaction produit
- Ambiance : lifestyle, aspirationnel, vertical TikTok/Reels framing

---

## ÉTAPE 4 — Génération vidéo

**Type UGC :**
Génère avec `generate_video` :
- model: `seedance_2_0`
- aspect_ratio: `9:16`
- resolution: `1080p`
- duration: [durée choisie]
- mode: `std`
- medias: [start_image si disponible avec role `start_image`]

**Type Ad :**
Génère avec `generate_video` :
- model: `marketing_studio_video`
- aspect_ratio: `9:16`
- resolution: `1080p`
- generate_audio: false (sauf si demandé)

**Type Cinema :**
Génère avec `generate_video` :
- model: `cinematic_studio_3_0`
- aspect_ratio: `9:16`
- medias: [start_image si disponible]

---

## ÉTAPE 5 — Résumé

```
✅ Vidéo Reels générée
📐 Format : 9:16 — 1080p
⏱️  Durée : [durée]s
🎬 Modèle : [modèle utilisé]
💡 Tip : Utilise /gen-tiktok pour adapter ce contenu sur TikTok
```
