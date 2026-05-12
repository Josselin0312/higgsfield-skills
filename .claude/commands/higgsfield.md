# Higgsfield — Génération d'images et de vidéos IA

Utilise ce skill pour générer des images ou des vidéos avec Higgsfield.

## Déclencheurs

Utilise ce skill quand l'utilisateur :
- demande à générer une image ou une vidéo avec Higgsfield
- veut créer du contenu visuel IA (publicité, cinématique, portrait, produit…)
- veut analyser la viralité d'une vidéo
- tape `/higgsfield`

## Workflow

### 1. Clarifier la demande

Si le type de contenu n'est pas clair, pose **une seule question** :
- Image ou vidéo ?
- Quel est le sujet / le contexte ?
- Y a-t-il une image de référence à uploader ?

### 2. Choisir le bon modèle

Appelle toujours `models_explore` pour obtenir les contraintes exactes (durées, ratios, paramètres) avant de générer.

**Images :**
| Cas | Modèle par défaut |
|---|---|
| Produit / pub | `marketing_studio_image` |
| Portrait / personnage avec référence | `soul_2` |
| Ultra HD, texte dans l'image | `nano_banana_2` |
| Personnage sans référence | `soul_cast` |

**Vidéos :**
| Cas | Modèle par défaut |
|---|---|
| Pub / produit commercial | `marketing_studio_video` |
| Identité forte, référence | `seedance_2_0` |
| Multi-shot, audio, motion transfer | `kling3_0` |

### 3. Générer

- Pour **images** → `generate_image`
- Pour **vidéos** → `generate_video`
- Si l'utilisateur fournit un fichier local → `media_upload` puis `media_confirm` avant de générer
- Pour vérifier le coût avant de lancer → passe `get_cost: true`

### 4. Analyse de viralité (optionnel)

Si l'utilisateur veut analyser une vidéo générée ou uploadée → `virality_predictor` avec `action: "create"`.

## Règles

- Ne pas entraîner un Soul Character sauf si l'utilisateur demande explicitement un personnage réutilisable avec 5–20 photos.
- Toujours appeler `models_explore` si tu as un doute sur les paramètres du modèle.
- Affiche le résultat avec `job_display` si nécessaire.
- Garde les prompts concis mais précis : style, lumière, cadrage, émotion.
