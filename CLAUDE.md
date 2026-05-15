# Agence Contenu AI — Higgsfield Hub

## Contexte
Agence de création de contenu AI pour influenceurs. Le rôle est de générer du contenu IA à la place des influenceurs partenaires pour leurs réseaux sociaux.

## Plateformes cibles
- **Instagram Feed** → images 4:5 (portrait) ou 1:1 (carré)
- **Instagram Reels** → cover image 9:16 + vidéo 9:16
- **TikTok** → vidéo 9:16
- **Threads** → image 1:1 ou 4:5

## Modèles Higgsfield recommandés par usage

### Images
| Usage | Modèle ID | Pourquoi |
|-------|-----------|----------|
| Portrait influenceur réaliste (UGC/mode) | `soul_2` | Meilleur pour personnages cohérents |
| Influenceur cinématique | `soul_cinematic` | Style éditorial/film |
| Pub produit social | `marketing_studio_image` | One-click ads sociaux |
| Qualité ultra 4K texte/diagrams | `nano_banana_2` | Meilleure qualité générale |
| Rapide / preview | `nano_banana_flash` | Fast & cheap |

### Vidéos
| Usage | Modèle ID | Pourquoi |
|-------|-----------|----------|
| Reels/TikTok UGC identité stable | `seedance_2_0` | Cohérence de personnage |
| Marketing Reels/TikTok ads | `marketing_studio_video` | One-click TikTok/Reels ready |
| Cinématique premium | `cinematic_studio_3_0` | Meilleure qualité vidéo |
| Multi-shot avec audio | `kling3_0` | Audio sync + motion transfer |
| Budget / batch clips | `veo3_1_lite` | Rapide et pas cher |

## Formats par plateforme

| Plateforme | Type | Ratio | Résolution conseillée |
|-----------|------|-------|----------------------|
| Instagram Feed | Image | 4:5 ou 1:1 | 2k |
| Instagram Reels (cover) | Image | 9:16 | 2k |
| Instagram Reels (vidéo) | Vidéo | 9:16 | 1080p |
| TikTok | Vidéo | 9:16 | 1080p |
| Threads | Image | 1:1 ou 4:5 | 1k ou 2k |

## Workflow type
1. Choisir l'influenceur (Soul Character avec `soul_id` si entraîné)
2. Choisir la plateforme → utiliser le skill correspondant
3. Décrire le contenu voulu
4. Générer, vérifier, télécharger

## Skills disponibles
- `/content-hub` → Tableau de bord principal (vue d'ensemble + historique)
- `/gen-instagram-feed` → Image Instagram Feed (4:5 / 1:1)
- `/gen-reels` → Image cover Reels (9:16)
- `/gen-video-reel` → Vidéo pour Instagram Reels
- `/gen-tiktok` → Vidéo TikTok (9:16)
- `/gen-threads` → Image Threads (1:1 / 4:5)
