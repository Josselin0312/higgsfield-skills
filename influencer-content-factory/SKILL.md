---
name: influencer-content-factory
description: >
  Skill de production de contenu visuel IA en masse pour des influenceurs, via Higgsfield (Nano Banana Pro).
  Utilise des images de référence (visage + corps) pour générer des contenus cohérents et réalistes.
  Génère des prompts JSON ultra-détaillés à partir d'images d'inspiration, puis appelle Higgsfield directement.
  
  Utilise cette skill dès que l'utilisateur mentionne : générer des images pour un influenceur, créer un carrousel Instagram ou TikTok, produire un script visuel, générer des images réelles pour vidéo IA, ou tout workflow de création de contenu pour des comptes à développer.
  
  Formats supportés : Instagram carrousel (3-4 images), TikTok carrousel (2-6 images), Scripts (N scènes × N images, storytelling séquentiel), Image réel (N images standalone pour base vidéo IA).
---

# Influencer Content Factory

Skill de production de contenu visuel IA en masse pour agence de gestion d'influenceurs.
Modèle Higgsfield exclusif : **Nano Banana Pro**. Format par défaut : **9:16**.

---

## Vue d'ensemble du workflow

```
1. Réception du brief (influenceur, format, inspiration ou scénario)
2. Analyse de l'image d'inspiration → génération du JSON prompt
3. Présentation du plan complet à l'utilisateur → confirmation
4. Génération via Higgsfield (refs visage + corps obligatoires)
5. Les images restent dans Higgsfield (pas de téléchargement local)
```

---

## Étape 1 — Identifier les informations nécessaires

Avant toute génération, s'assurer d'avoir :

| Information | Description |
|---|---|
| **Influenceur** | Prénom + nom (ex : "Lily Bloom") |
| **Refs Higgsfield** | Image visage (job_id ou media_id) + Image corps (job_id ou media_id) |
| **Format** | Instagram carrousel / TikTok carrousel / Scripts / Image réel |
| **Image d'inspiration** | URL ou image uploadée (pour analyse JSON) |
| **Brief narratif** | Pour les Scripts uniquement : scénario, nb scènes, nb images/scène |

Si des informations manquent, les demander avant de continuer.

---

## Étape 2 — Analyser l'image d'inspiration et générer le JSON prompt

### Prompt d'analyse à envoyer à Claude (si image fournie)

Quand une image d'inspiration est fournie, l'analyser en profondeur et générer un JSON structuré selon ce modèle :

```json
{
  "image_type": "",
  "orientation": "vertical",
  "composition": {
    "shot_type": "",
    "camera_style": "",
    "angle": "",
    "framing": "",
    "focus_priority": []
  },
  "scene": {
    "type": "",
    "setting": "",
    "time_of_day": "",
    "lighting": {
      "type": "",
      "direction": "",
      "quality": "",
      "effect": ""
    },
    "background": {},
    "atmosphere": []
  },
  "situation": {
    "apparent_activity": "",
    "likely_context": [],
    "interaction_with_scene": ""
  },
  "subject": {
    "count": 1,
    "placement": "",
    "body_orientation": ""
  },
  "pose": {
    "head_position": "",
    "shoulders": "",
    "neck_posture": "",
    "overall_pose_style": []
  },
  "facial_expression": {
    "overall_expression": "",
    "eyes": "",
    "mouth_and_tongue": "",
    "cheeks_and_nose": "",
    "head_tilt_and_angle": "",
    "emotional_tone": "",
    "muscle_engagement": ""
  },
  "outfit": {
    "overall_style": [],
    "top": {
      "type": "",
      "fit": "",
      "color": "",
      "features": []
    },
    "bottom": {
      "type": "",
      "fit": "",
      "color": ""
    },
    "footwear": {}
  },
  "accessories": {
    "jewelry": [],
    "bags": [],
    "other_accessories": []
  },
  "overall_mood": "",
  "photography_style": "",
  "image_quality": {
    "resolution": "high",
    "sharpness": "",
    "exposure": ""
  }
}
```

### Règles d'analyse :
- **Ne jamais décrire** la couleur des cheveux, des yeux, ou les traits physiques spécifiques du modèle (ce sont les images de référence qui s'en chargent)
- **Toujours inclure** : tattoos visibles (positions exactes), accessoires détaillés, texture des vêtements
- **Limiter à 6000 caractères** maximum
- **Langue du JSON** : anglais
- Pour les carrousels/scripts : **créer N variations** du même JSON en ne changeant que `pose`, `facial_expression`, et légèrement `lighting` ou `angle` (pour le réalisme)

---

## Étape 3 — Présenter le plan et demander confirmation

Avant tout appel à Higgsfield, présenter un résumé clair :

```
📋 PLAN DE GÉNÉRATION — [Prénom Influenceur] — [Format]

📁 Dossier : "[Prénom] - [Format]"
🖼️ Nombre d'images : X
📐 Format : 9:16
🤖 Modèle : Nano Banana Pro

[Pour carrousels] :
- Image 1 : [description courte de la pose/scène]
- Image 2 : [description courte]
- ...

[Pour Scripts] :
- Scène 1 "[titre]" : X images — [description courte]
- Scène 2 "[titre]" : X images — [description courte]
- ...

✅ Je lance la génération ?
```

Attendre une confirmation explicite ("oui", "lance", "go", etc.) avant de continuer.

---

## Étape 4 — Appeler Higgsfield

### Récupérer le modèle Nano Banana Pro

Avant la première génération de la session, récupérer l'ID exact du modèle :

```
→ Appeler models_explore avec query "nano banana"
→ Retenir le model_id exact pour toutes les générations suivantes
```

### Structure d'appel pour chaque image

```
generate_image avec :
- model : [model_id Nano Banana Pro]
- prompt : [JSON stringifié ou texte du prompt]
- aspect_ratio : "9:16" (sauf demande contraire)
- medias : [
    { value: [ref_visage_id], role: "face" },
    { value: [ref_corps_id], role: "image" }
  ]
```

### Ordre de génération

- **Carrousels** : générer les images une par une, en séquence
- **Scripts** : générer scène par scène, en annonçant chaque scène à l'utilisateur
- **Image réel** : générer toutes les images demandées en séquence

### Nommage des dossiers (pour référence dans la conversation)

Toujours annoncer le regroupement logique :
- `[Prénom] - Insta Carrousel`
- `[Prénom] - TikTok Carrousel`  
- `[Prénom] - Script [Titre du script]`
- `[Prénom] - Image Réel`

---

## Formats détaillés

### Instagram Carrousel (3-4 images)
- **Cohérence** : même lieu, même tenue, même lumière globale
- **Variations** : pose, expression, angle légèrement différents à chaque image
- **Ambiance** : lifestyle (simple ou bling), toujours réaliste
- **Ratio** : 9:16

### TikTok Carrousel (2-6 images)
- Même règles que Instagram
- Peut être plus dynamique dans les expressions/poses

### Scripts (N scènes × N images)
- L'utilisateur fournit le scénario complet (nb scènes, nb images, description)
- Claude propose d'abord le JSON de chaque scène, l'utilisateur valide
- **Cohérence intra-scène** : même lieu + tenue, variation de pose/expression
- **Transition inter-scènes** : changement de lieu/tenue si le scénario le demande
- Objectifs possibles : promotion produit, engagement émotionnel, immersion dans la vie de l'influenceur

### Image Réel (N images, variable)
- Images standalone optimisées pour être "animables" (conversion en vidéo IA)
- Cadrage soigné : éviter les poses trop statiques, favoriser une légère dynamique
- Chaque image doit fonctionner de façon autonome
- Nb d'images défini par l'utilisateur au cas par cas

---

## Règles de qualité à maintenir

1. **Réalisme avant tout** — le résultat doit être indiscernable d'une vraie photo
2. **Cohérence identitaire** — toujours utiliser les 2 images de référence (visage + corps)
3. **JSON exhaustif** — plus le prompt est détaillé, meilleure est la cohérence
4. **Ne jamais décrire les traits du modèle** dans les prompts (géré par les refs)
5. **Tattoos toujours inclus** dans le JSON si visibles sur les refs (marqueur de cohérence)
6. **Lighting réaliste** — lumière naturelle de préférence, jamais trop parfaite
7. **Légères variations** entre les images d'un même carrousel (pas de clones)

---

## Profils d'influenceurs enregistrés

### Lily Bloom
- **Ref visage** : à renseigner au début de chaque session (job_id ou media_id Higgsfield)
- **Ref corps** : à renseigner au début de chaque session (job_id ou media_id Higgsfield)
- **Style** : lifestyle réaliste, taches de rousseur, cheveux noirs longs, tatouages multiples
- **Ratio par défaut** : 9:16

> 💡 Pour ajouter un nouvel influenceur, demander : prénom + nom, ref visage, ref corps, notes de style.

---

## Référence des fichiers

- `references/json-structure.md` — exemples de JSON validés qui ont produit de bons résultats
- `references/platforms.md` — spécifications techniques par plateforme (à créer si besoin)
