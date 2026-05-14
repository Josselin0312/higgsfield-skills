# Higgsfield Bulk Image Generator

Générez des dizaines d'images en une seule commande. Aussi simple que possible.

---

## Comment faire (3 étapes)

### Étape 1 — Ouvrez `prompts.csv` dans Excel (ou n'importe quel éditeur)

Le fichier ressemble à ça :

| prompt | model |
|--------|-------|
| A golden retriever puppy playing in the snow | image_auto |
| A futuristic city at sunset with flying cars | cinematic_studio_2_5 |

- **prompt** = décrivez votre image en anglais
- **model** = le modèle à utiliser (laissez `image_auto` si vous ne savez pas)

### Étape 2 — Ajoutez vos propres lignes

Chaque ligne = une image. Ajoutez autant de lignes que vous voulez.

### Étape 3 — Tapez cette commande dans Claude Code

```
/bulk-generate
```

C'est tout. Claude génère toutes vos images automatiquement.

---

## Modèles disponibles

| Nom du modèle | Description |
|---------------|-------------|
| `image_auto` | Choisit automatiquement le meilleur modèle ✨ |
| `nano_banana_2` | Qualité maximale, texte et diagrammes |
| `nano_banana_flash` | Rapide et haute qualité |
| `soul_2` | Portraits et personnages réalistes |
| `cinematic_studio_2_5` | Photos cinématographiques, style film |
| `flux_2` | Précis, suit bien les descriptions |
| `gpt_image_2` | Excellent pour le texte dans les images |
| `marketing_studio_image` | Photos produit pour les réseaux sociaux |

---

## Exemple de fichier `prompts.csv`

```
prompt,model
A cat wearing a tiny hat,image_auto
A mountain landscape at dawn,cinematic_studio_2_5
A logo for a bakery called "Le Petit Pain",gpt_image_2
```
