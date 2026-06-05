# Guide: Automatisation de Génération d'Images avec Higgsfield

## 🎯 Vue d'ensemble

Cette solution automatise la génération d'images en 2 étapes :

1. **Analyse & Génération de Prompts** — Claude analyse une image de référence et génère des prompts structurés
2. **Génération d'Images** — Higgsfield crée les images basées sur ces prompts

## 🚀 Utilisation dans Claude Code

### Approche 1 : Via la route API (depuis le navigateur)

```bash
# 1. Lancer le serveur
npm run dev

# 2. Dans le navigateur ou avec curl :
curl -X POST http://localhost:3000/api/image-automation \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/image.jpg",
    "styles": ["minimal", "professional", "luxury", "creative"]
  }'
```

### Approche 2 : Utiliser directement la fonction (dans Claude Code)

Voici comment l'utiliser directement dans Claude Code avec Higgsfield :

```typescript
import { analyzeImageAndGeneratePrompts, createHiggsFieldInstructions } from "./src/lib/image-automation";

const imageUrl = "https://example.com/my-image.jpg";
const styles = ["minimal", "professional", "luxury", "creative"];
const apiKey = process.env.ANTHROPIC_API_KEY;

const analysis = await analyzeImageAndGeneratePrompts(imageUrl, styles, apiKey);
console.log("Analyse:", analysis.analysis);
console.log("Prompts générés:", analysis.prompts);

// Obtenir les instructions pour Higgsfield
const instructions = createHiggsFieldInstructions(analysis);
console.log(instructions);
```

## 🎨 Workflow Complet : Image → Variations

### Étape 1 : Analyser une image et générer les prompts

```bash
# Depuis Claude Code, appelle la route
curl -X POST http://localhost:3000/api/image-automation \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://images.unsplash.com/photo-entrepreneur.jpg",
    "styles": ["minimalist design", "luxury lifestyle", "corporate professional", "creative artistic"]
  }'
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "analysis": "L'image montre un entrepreneur en tenue business...",
    "prompts": [
      {
        "style": "minimalist design",
        "prompt": "Portrait of professional entrepreneur, minimalist aesthetic...",
        "details": "Couleurs: noir, blanc, gris. Style: épuré, moderne"
      },
      ...
    ],
    "instructions": "## Instructions pour Générer les Images avec Higgsfield\n\nUtilise le tool `mcp__Higgsfield__generate_image` pour chaque prompt..."
  }
}
```

### Étape 2 : Générer les images avec Higgsfield

Pour chaque prompt, appelle Higgsfield (disponible dans Claude Code) :

```typescript
// Utiliser Higgsfield directement (dans Claude Code)
await mcp__Higgsfield__generate_image({
  params: {
    model: "soul_2",
    prompt: "Portrait of professional entrepreneur, minimalist aesthetic, clean lighting, centered composition, 9:16 format",
    aspect_ratio: "9:16",
    count: 1
  }
});
```

## 📝 Exemples de Styles

### Pour Portraits / Personal Brand

```
styles: [
  "professional headshot",
  "lifestyle casual",
  "luxury editorial",
  "personal brand authentic"
]
```

### Pour Content Creator / Influenceur

```
styles: [
  "Instagram aesthetic",
  "TikTok viral style",
  "YouTube thumbnail worthy",
  "Pinterest-optimized"
]
```

### Pour Produit / Offre

```
styles: [
  "e-commerce product shot",
  "luxury packaging",
  "minimalist mockup",
  "lifestyle integration"
]
```

## 🔧 Structure des Données

### ImageAnalysis (Sortie de `analyzeImageAndGeneratePrompts`)

```typescript
interface ImageAnalysis {
  analysis: string; // Description détaillée de l'image
  prompts: Array<{
    style: string;           // Le style appliqué
    prompt: string;          // Le prompt en anglais pour Higgsfield
    details: string;         // Détails visuels clés
  }>;
}
```

### HiggsField Generation Payload

```json
{
  "model": "soul_2",
  "aspect_ratio": "9:16",
  "prompt": "...",
  "count": 1
}
```

## 🎬 Use Cases

### 1. Créer des variations de Personal Brand

```bash
# Une seule image de toi, plusieurs styles
curl -X POST http://localhost:3000/api/image-automation \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/my-photo.jpg",
    "styles": ["casual entrepreneur", "formal CEO", "creative influencer", "luxury brand ambassador"]
  }'
```

### 2. Reproduire l'esthétique d'un competitor

```bash
# Analyse l'image d'un concurrent et génère des variations
curl -X POST http://localhost:3000/api/image-automation \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://competitor.com/aesthetic.jpg",
    "styles": ["same_style_own_twist", "elevated_version", "niche_specific", "audience_adapted"]
  }'
```

### 3. Batch Generation pour Instagram

```bash
# Générer un lot d'images pour une campagne
for style in "feed_aesthetic" "story_version" "reel_thumbnail" "highlight_cover"; do
  curl -X POST http://localhost:3000/api/image-automation \
    -H "Content-Type: application/json" \
    -d "{\"imageUrl\": \"$IMAGE_URL\", \"styles\": [\"$style\"]}"
done
```

## ⚙️ Configuration Avancée

### Personnaliser les Modèles Higgsfield

Dans `src/lib/image-automation.ts`, modifie `buildHiggsFieldPayload()`:

```typescript
export function buildHiggsFieldPayload(
  analysis: ImageAnalysis,
  model: string = "soul_2",  // ou "nano_banana_pro" pour qualité supérieure
  aspectRatio: string = "9:16"
) {
  // ...
}
```

**Modèles disponibles:**
- `soul_2` — Portraits réalistes, polyvalent
- `nano_banana_pro` — Qualité 4K, plus détaillé
- `marketing_studio_image` — Commercial, produits
- `soul_cast` — Texte-to-image simple

### Personnaliser les Ratios d'Aspect

Pour TikTok/Instagram Reels: `"9:16"`
Pour Instagram Feed: `"1:1"`
Pour YouTube Thumbnail: `"16:9"`

## 🔌 Intégration API

Ton app expose une route `POST /api/image-automation` :

### Request
```json
{
  "imageUrl": "https://...",
  "styles": ["style1", "style2", ...]
}
```

### Response
```json
{
  "success": true,
  "data": {
    "imageUrl": "...",
    "analysis": "Description...",
    "prompts": [...],
    "instructions": "..."
  }
}
```

## 🎯 Bonnes Pratiques

1. **URL d'image** — Utilise des URLs stables et accessibles publiquement
2. **Styles** — Sois précis: "minimalist design" > "simple"
3. **Aspect ratio** — Adapte au format final (Instagram, TikTok, etc.)
4. **Batch processing** — Génère plusieurs styles à la fois pour économiser les crédits
5. **A/B Testing** — Compares les résultats de différents modèles Higgsfield

## 📊 Flux Récapitulatif

```
Image de Référence
       ↓
analyzeImageAndGeneratePrompts() ← Claude analyse et génère les prompts
       ↓
ImageAnalysis { analysis, prompts[] }
       ↓
Pour chaque prompt:
  mcp__Higgsfield__generate_image()
       ↓
Images générées ✅
```

---

**Next:** Intègre ce workflow dans ton UI pour que les utilisateurs puissent générer des images en 1 clic!
