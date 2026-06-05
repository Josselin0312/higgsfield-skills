# 🎬 Carousel Automation - Quick Start

Bienvenue! Tu as maintenant une **automation complète** pour générer des carrousels Instagram.

## ⚡ Utilisation en 3 minutes

### 1️⃣ Prépare tes images

Tu as besoin de:
- **Image Instagram** (celle que tu veux reproduire) → URL
- **Tête de la personne** (headshot) → URL
- **Corps de la personne** (sans tête, full body) → URL

### 2️⃣ Lancer la génération

```bash
# Option A: Via CLI (plus rapide)
npx ts-node scripts/carousel.ts \
  --instagram "https://instagram.com/influencer/photo.jpg" \
  --head "https://example.com/head.jpg" \
  --body "https://example.com/body.jpg"
```

**Output:** Toutes les instructions pour Higgsfield, prêtes à copier.

```bash
# Option B: Via API
curl -X POST http://localhost:3000/api/carousel/prepare \
  -H "Content-Type: application/json" \
  -d '{
    "instagramImageUrl": "...",
    "headImageUrl": "...",
    "bodyImageUrl": "..."
  }'
```

### 3️⃣ Générer dans Higgsfield

1. Copie les instructions du CLI
2. Va dans Higgsfield
3. Suit les 3 étapes:
   - Upload head + body images
   - Paste le prompt complet
   - Clique Generate (nano_banana_pro, 9:16, 2k)

### 4️⃣ Générer les variations

Une fois la première image générée:

```bash
npx ts-node scripts/carousel.ts \
  --instagram "https://instagram.com/influencer/photo.jpg" \
  --head "https://example.com/head.jpg" \
  --body "https://example.com/body.jpg" \
  --variations "make her smile:Sourire;close eyes:Yeux fermés"
```

**Pour chaque variation:**
- Upload l'image générée précédente dans Higgsfield
- Paste le prompt simple (ex: "make her smile")
- Generate

## 🎯 Le Process Automatisé

```
Ton image Instagram
        ↓
Claude analyse (JSON exhaustif)
        ↓
Formatte pour Higgsfield
        ↓
Tu copie/colle dans Higgsfield
        ↓
Image originale générée
        ↓
Variations (sourire, yeux, etc)
        ↓
Carrousel 5 images prêt! ✅
```

## 📚 Documentation Complète

- **CAROUSEL_AUTOMATION_GUIDE.md** — Guide détaillé avec tous les détails
- **scripts/carousel.ts** — Script CLI complet
- **src/lib/carousel-automation.ts** — Logique d'analyse
- **src/lib/higgsfield-orchestrator.ts** — Orchestration Higgsfield

## 🔧 Fichiers Créés

```
src/lib/
├── carousel-automation.ts          # Analyse + préparation
└── higgsfield-orchestrator.ts      # Orchestration

src/app/api/carousel/
├── prepare/route.ts                # POST /api/carousel/prepare
├── variation/route.ts              # POST /api/carousel/variation
└── analyze/route.ts                # POST /api/carousel/analyze

scripts/
└── carousel.ts                      # CLI principal
```

## 💡 Exemples

### Carousel Simple (sourire)

```bash
npx ts-node scripts/carousel.ts \
  --instagram "https://insta.com/girl.jpg" \
  --head "https://me.com/head.jpg" \
  --body "https://me.com/body.jpg"
```

Output: Instructions pour une image

### Carousel Complet (5 images)

```bash
npx ts-node scripts/carousel.ts \
  --instagram "https://insta.com/girl.jpg" \
  --head "https://me.com/head.jpg" \
  --body "https://me.com/body.jpg" \
  --variations "make her smile:Sourire;close eyes:Yeux;look left:Regarder gauche;serious:Sérieuse;mouth open:Bouche ouverte"
```

Output: Plan complet avec 5 variations

### Sauvegarder en Fichier

```bash
npx ts-node scripts/carousel.ts \
  --instagram "..." \
  --head "..." \
  --body "..." \
  --output carousel-instructions.txt
```

## 🎨 Ce Que Claude Fait

Automatiquement:
- ✅ Analyse l'image Instagram en détail
- ✅ Génère un JSON exhaustif (composition, éclairage, outfit, pose, etc.)
- ✅ Formate tout pour Higgsfield (copier/coller)
- ✅ Crée les instructions pour les variations

## 🎬 Ce Que Tu Fais dans Higgsfield

Manuellement:
1. Upload head + body images
2. Colle le prompt JSON
3. Clique Generate
4. Pour chaque variation: upload l'image précédente + prompt simple

**Pourquoi?** Higgsfield a une interface interactive et c'est plus rapide qu'une API.

## ⚙️ Configuration

- **Modèle:** nano_banana_pro (qualité 2k)
- **Aspect Ratio:** 9:16 (Instagram Reels/Stories)
- **Quality:** 2k (standard)

Ces paramètres sont **fixes pour tous les carrousels Instagram**.

## 🚀 Prochaines Étapes

### Maintenant (utilisation simple):
1. Teste le CLI avec tes images
2. Follow les instructions dans Higgsfield
3. Obtiens ton carrousel!

### Plus tard (intégration UI):
- Créer une interface dans /studio ou /skills
- Upload les images directement
- Gérer les variations dans l'app
- Télécharger le carrousel final

### Même plus tard (full automation):
- Intégrer Higgsfield API (si disponible)
- Générer directement sans copier/coller
- Batch processing (plusieurs carrousels en série)

## 📞 Questions?

Tout est flexible! On peut adapter:
- Les variations
- Les modèles Higgsfield
- Les aspect ratios
- Ajouter des paramètres custom

Just demande! 🚀

---

**Commit:** feat: Carousel Instagram automation - complete pipeline
**Branch:** claude/affectionate-volta-ccUjh
