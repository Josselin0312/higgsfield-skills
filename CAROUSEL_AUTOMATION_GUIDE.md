# 🎨 Carousel Instagram Automation Guide

Automatise complètement la génération de carrousels Instagram en combinant Claude et Higgsfield.

## 📋 Vue d'ensemble du Process

```
1. Image Instagram de référence
        ↓
2. Claude analyse → JSON exhaustif
        ↓
3. Upload tête + corp dans Higgsfield
        ↓
4. Paste le prompt complet
        ↓
5. Génère l'image originale
        ↓
6. Variations (sourire, yeux fermés, etc.)
        ↓
7. Carroussel final prêt! 🎉
```

## 🚀 Utilisation Rapide (CLI)

### Étape 1: Analyser et Préparer

```bash
npx ts-node scripts/carousel.ts \
  --instagram "https://instagram.com/influencer/photo.jpg" \
  --head "https://example.com/head.jpg" \
  --body "https://example.com/body.jpg" \
  --format instructions
```

**Output:** Toutes les instructions pour Higgsfield formatées et prêtes à copier.

### Étape 2: Générer dans Higgsfield

1. Copie les instructions du output CLI
2. Va dans Higgsfield
3. Suivre les 3 étapes:
   - Upload head image
   - Upload body image
   - Paste le prompt complète
4. Clique Generate (nano_banana_pro, 9:16, 2k)

### Étape 3: Générer les Variations

Pour chaque variation (sourire, yeux, etc.):

```bash
npx ts-node scripts/carousel.ts \
  --instagram "https://instagram.com/influencer/photo.jpg" \
  --head "https://example.com/head.jpg" \
  --body "https://example.com/body.jpg" \
  --variations "make her smile:Smiling; frown:Sad expression; eyes closed:Sleepy look"
```

Cela affiche le plan pour générer chaque variation.

## 🔧 Détails des Routes API

### POST `/api/carousel/prepare`

**Le point d'entrée principal**

```json
{
  "instagramImageUrl": "https://...",
  "headImageUrl": "https://...",
  "bodyImageUrl": "https://...",
  "variations": [
    { "variation": "make her smile", "description": "Smiling" },
    { "variation": "close her eyes", "description": "Closed eyes" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "carousel_...",
    "analysis": { /* image analysis */ },
    "higgsFieldInstructions": "## Step 1: Upload...",
    "carouselConfig": { /* full config */ },
    "nextSteps": [...]
  }
}
```

### POST `/api/carousel/variation`

**Pour gérer les variations après la première image**

```json
{
  "previousGeneratedImageUrl": "https://higgsfield-result.jpg",
  "variationPrompt": "make her smile",
  "description": "Smiling",
  "keepIdentity": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "formattedPromptForHiggsfield": "Keep the same person. make her smile\n\nReference image: ...",
    "instructions": [...]
  }
}
```

## 📸 Workflow Détaillé avec Exemples

### Exemple Complet: Créer un Carousel de 5 Images

**Image de référence Instagram:**
- URL: `https://instagram.com/influencer/post.jpg`

**Références personne:**
- Head: `https://drive.google.com/my-head.jpg`
- Body: `https://drive.google.com/my-body.jpg`

**Variations voulues:**
1. Sourire (original)
2. Yeux fermés
3. Expression sérieuse
4. Petit sourire

**Commande:**

```bash
npx ts-node scripts/carousel.ts \
  --instagram "https://instagram.com/influencer/post.jpg" \
  --head "https://drive.google.com/my-head.jpg" \
  --body "https://drive.google.com/my-body.jpg" \
  --variations "make her smile:Smiling;close her eyes:Closed eyes;serious expression:Serious;small smile:Subtle smile" \
  --format instructions \
  --output carousel-instructions.txt
```

**Résultat:** `carousel-instructions.txt` contient tout ce qu'il faut pour Higgsfield

### Steps dans Higgsfield

```
📝 Step 1: Upload Images
- Drag & drop the head image
- Drag & drop the body image

📝 Step 2: Paste This Prompt
[COPY-PASTE FROM CLI OUTPUT]

⚙️ Step 3: Set Parameters
- Model: nano_banana_pro
- Aspect Ratio: 9:16
- Quality: 2k

🎬 Step 4: Click Generate

🔄 Step 5: Generate Variations
- Upload previous generated image
- Clear chat (remove old text)
- Paste: "Keep the same person. make her smile"
- Generate
- Repeat for each variation
```

## 🎯 Les 3 Types d'Images de Référence

### 1. Image Instagram (ce qu'on veut reproduire)
- L'esthétique, la pose, l'outfit, l'ambiance
- Claude analyse ça en détail
- Génère un JSON exhaustif

### 2. Image Tête (de la personne)
- Juste le visage, gros plan
- Served as identity reference
- Higgsfield préserve l'identité

### 3. Image Corps (de la personne)
- Sans la tête (juste le corps/torse)
- Full body or upper body shot
- Pour maintenir les proportions

## 📊 JSON Analysis Structure

Claude génère automatiquement:

```json
{
  "image_type": "car selfie / beauty portrait",
  "composition": {
    "shot_type": "close-up to upper-torso portrait",
    "camera_style": "front-facing smartphone selfie",
    "angle": "slightly above chest level",
    "framing": "subject occupies most of the frame",
    "focus_priority": ["face and expression", "makeup"]
  },
  "scene": {
    "setting": "inside a car during daytime",
    "lighting": {
      "type": "natural daylight",
      "quality": "soft, bright, even"
    }
  },
  "outfit": {
    "top": {
      "type": "thin-strap camisole",
      "color": "black"
    }
  },
  "accessories": {
    "jewelry": [
      { "type": "hoop earring", "style": "minimal metal" }
    ]
  }
  // ... plus de détails
}
```

**Important:** Claude ne décrit pas:
- Couleur des cheveux
- Couleur des yeux
- Texte/copywriting sur l'image

## 🔄 Variations Courantes

```
Sourire: "make her smile"
Yeux fermés: "close her eyes" ou "eyes closed"
Bras levé: "raise her right arm"
Tête tournée: "turn her head to the left"
Bouche ouverte: "open mouth slightly"
Expression sérieuse: "serious expression"
Regard vers le haut: "look up"
Cligner des yeux: "blink"
```

## 📁 Structure des Fichiers

```
src/
├── lib/
│   ├── carousel-automation.ts      # Analyse image + préparation
│   ├── higgsfield-orchestrator.ts  # Orchestration Higgsfield
│   └── image-automation.ts         # Ancien (garder pour compatibilité)
├── app/api/
│   └── carousel/
│       ├── analyze/route.ts        # Analyser l'image
│       ├── prepare/route.ts        # Préparer tout
│       └── variation/route.ts      # Générer variations
scripts/
├── carousel.ts                      # CLI principal
└── automate-image-generation.ts    # Ancien (garder)
```

## ⚙️ Configuration

### Modèles Disponibles

- **nano_banana_pro** ← **À utiliser pour carousel** (qualité 2k, 9:16)
- soul_2 (portraits génériques)
- marketing_studio_image (commercial)

### Aspect Ratios

- `9:16` ← Pour Instagram Reels/Stories
- `1:1` pour Instagram Feed
- `16:9` pour YouTube

### Quality Settings

- `2k` ← **Standard pour carousel**
- `4k` (plus lourd, plus lent)
- `1k` (rapide, moins détaillé)

## 🎓 Bonnes Pratiques

1. **Images de référence** - Utilise des URLs accessibles et stables
2. **Pose** - La pose sur l'image Instagram détermine la pose finale
3. **Éclairage** - L'éclairage dans l'image Instagram est reproduit
4. **Outfit** - Les vêtements de l'image Instagram sont reproduits
5. **Variations** - Utilise des prompts simples et directs
6. **Keep Identity** - Toujours garder `keepIdentity: true` pour les variations

## 🚨 Troubleshooting

### "Image not recognized"
- Vérifie que l'URL est accessible publiquement
- La tête et le corps doivent être clairs

### "Prompt too long"
- Le JSON sera limité par Higgsfield
- Si trop long, Higgsfield va le tronquer automatiquement

### "Identity not preserved"
- Assure-toi d'upload la tête ET le corps
- Vérifie que `keepIdentity: true` est dans le prompt

### "Wrong aspect ratio"
- Vérifie dans Higgsfield que 9:16 est sélectionné
- CLI met les bons paramètres par défaut

## 🔗 Intégration avec Ton App

Si tu veux intégrer ça dans l'interface IGFlow:

```tsx
// Dans /studio ou /skills
import { useCarouselAutomation } from '@/hooks/useCarouselAutomation'

export function CarouselGenerator() {
  const { analyze, generate, variation } = useCarouselAutomation()
  
  const handleGenerate = async (instagramUrl, headUrl, bodyUrl) => {
    const analysis = await analyze(instagramUrl)
    // Guide user through Higgsfield...
  }
}
```

## 📞 Next Steps

1. **Tester le CLI:**
   ```bash
   npx ts-node scripts/carousel.ts --instagram <url> --head <url> --body <url>
   ```

2. **Tester via API:**
   ```bash
   curl -X POST http://localhost:3000/api/carousel/prepare \
     -H "Content-Type: application/json" \
     -d '{...}'
   ```

3. **Intégrer dans l'UI** (si besoin)

4. **Batch processing** (générer plusieurs carrousels en série)

---

**Questions?** Tout est flexible et on peut adapter selon tes besoins! 🚀
