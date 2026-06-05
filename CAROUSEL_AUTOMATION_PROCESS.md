# 🎨 PROCESSUS D'AUTOMATISATION CAROUSEL INSTAGRAM

## 📋 CONTEXTE GLOBAL

**Objectif:** Automatiser la génération d'images carousel Instagram en basant la création sur une image de référence Instagram existante + des photos de référence (head/body).

**Approche:** 
- Analyser une image Instagram pour en extraire tous les détails visuels
- Utiliser Higgsfield + nano_banana_pro pour générer une image qui reproduit l'original
- Générer des variantes individuellement selon les demandes
- Le nombre et type de variantes dépend entièrement de ce que l'utilisateur veut après validation de l'image originale

---

## 📥 INPUTS REQUIS

### 1. Image Instagram de Référence
- **Nom:** `instagram.png` (ou .jpg)
- **Contenu:** L'image Instagram originale à reproduire
- **Utilisé pour:** Analyser la composition, pose, vêtements, expression, lighting, background

### 2. Photo de Référence - Head
- **Nom:** `head.png` (ou .jpg)
- **Contenu:** Photo du visage/tête seulementde la personne
- **Utilisé pour:** Référence faciale dans Higgsfield (identity, face, proportions)

### 3. Photo de Référence - Body
- **Nom:** `body.png` (ou .jpg)
- **Contenu:** Photo du corps entier SANS la tête
- **Utilisé pour:** Référence corporelle dans Higgsfield (body proportions, posture)

---

## ⚙️ PROCESSUS DÉTAILLÉ

### ÉTAPE 1: ANALYSE DE L'IMAGE INSTAGRAM

**Objectif:** Extraire tous les éléments visuels importants en JSON structuré

**Actions:**
1. Passer l'image Instagram à Claude Vision avec ce prompt:
   ```
   Analyse this image in exhaustive JSON detail. Don't exceed 6000 characters. 
   Detail the exact identical situation, the outfit, the facial expressions, the clothes, the accessories. 
   Don't describe the model detail such as the hair color, the eyes color and dont describe the copywriting on the photo.
   
   Return ONLY valid JSON with this structure:
   {
     "setting": "...",
     "lighting": "...",
     "pose": "...",
     "expression": "...",
     "clothing": {...},
     "accessories": [...],
     "background": "...",
     "composition": "..."
   }
   ```

2. Claude retourne un JSON détaillé avec:
   - **setting**: Le lieu/environnement (studio, outdoor, etc.)
   - **lighting**: Type et direction de l'éclairage
   - **pose**: Position du corps, angles, posture
   - **expression**: Expression faciale
   - **clothing**: Tous les vêtements et leurs caractéristiques
   - **accessories**: Bijoux, sacs, etc.
   - **background**: Ce qui est derrière
   - **composition**: Cadrage, framing, proportions

**Important:** 
- ❌ NE PAS inclure: couleur cheveux, couleur yeux, autres features physiques de la personne
- ✅ INCLURE: composition, pose, vêtements, expression, setup, lighting

---

### ÉTAPE 2: GÉNÉRER 1 IMAGE ORIGINALE

**Objectif:** Générer UNE SEULE image qui reproduit l'image Instagram

**Parameters Higgsfield:**
- **Model:** `nano_banana_pro`
- **Aspect Ratio:** `9:16` (format Instagram vertical)
- **Quality/Resolution:** `2k`
- **Count:** `1` (une seule image)

**Médias de Référence:**
- Role: `image`
- Value 1: URL/path de `head.png`
- Value 2: URL/path de `body.png`

**Prompt à Passer:**
```
Use the provided images strictly as a reference for the same model (identity, face, body proportions, hair color). 
The things you need to change are listed here (clothes, place etc) keep the same smile:

[INSÉRER LE JSON DE L'ÉTAPE 1 ICI]
```

**Processus:**
1. Uploader head.png et body.png dans Higgsfield (via media_upload)
2. Appeler generate_image avec:
   - Le prompt ci-dessus + le JSON
   - Les 2 images comme références
   - Les paramètres spécifiés
3. Attendre la génération (status = "completed")
4. **TÉLÉCHARGER l'image générée et l'afficher dans Claude** (pas juste le lien)

**Important:**
- ⚠️ Générer UNE SEULE image à cette étape
- ⚠️ Ne PAS générer les variantes en même temps
- ⚠️ Attendre la validation de l'utilisateur avant les variantes

---

### ÉTAPE 3: VALIDATION + VARIATIONS (APRÈS)

**Objectif:** Valider l'image originale, puis générer les variantes demandées individuellement

**Processus:**
1. Afficher l'image générée dans Claude
2. Attendre la validation de l'utilisateur:
   - ✅ "C'est bon" → passer aux variantes
   - ❌ "Redo" → recommencer Étape 2 avec des ajustements
   - 🤔 "Des variantes de..." → noter les demandes

3. Pour CHAQUE variante demandée:
   - L'utilisateur spécifie: "Je veux une variation avec [X changement]"
   - Exemples: "sourire plus grand", "expression sérieuse", "yeux fermés", "pose différente", etc.
   - Envoyer à Higgsfield:
     - Upload l'image générée Étape 2 comme référence
     - Prompt: "Use this image as reference, change only: [la demande spécifique]"
     - Même parameters (nano_banana_pro, 9:16, 2k)
   - Afficher chaque variante dans Claude une fois générée

---

## 📊 OUTPUTS

**Nombre d'images finales:** Dépend entièrement de ce que l'utilisateur veut
- Minimum: 1 image (l'originale seule)
- Maximum: Aussi nombreuses que désiré (5, 10, 20, etc.)
- Exemple: 1 originale + 3 variantes = 4 images total

**Format des outputs:**
- Chaque image est **téléchargée et affichée directement dans Claude**
- Format: PNG ou JPG
- Dimensions: 768x1344 (9:16 @ 1k resolution) ou similaire selon Higgsfield

---

## ⚠️ PIÈGES À ÉVITER

1. ❌ **Générer toutes les variantes d'un coup** 
   - ✅ À la place: générer 1 image, valider, PUIS demander les variantes

2. ❌ **Prédéfinir les variations à l'avance**
   - ✅ À la place: c'est l'utilisateur qui décide après validation

3. ❌ **Juste donner les URLs des images**
   - ✅ À la place: télécharger et afficher les images dans Claude

4. ❌ **Inclure les features physiques dans l'analyse JSON**
   - ✅ À la place: composition, vêtements, pose, expression seulement

5. ❌ **Générer l'image avant validation de l'analyse**
   - ✅ À la place: montrer l'analyse JSON d'abord si demandé

---

## 🔑 POINTS CLÉS À RETENIR

- **Workflow itératif:** Pas tout d'un coup, une étape à la fois
- **Validation humaine:** Chaque image générée doit être validée avant la suivante
- **Flexibilité:** Le nombre de variantes et leur type est décidé pendant le processus, pas avant
- **Images dans Claude:** Les outputs doivent être affichés directement (pas juste URLs)
- **Google Drive:** Les images peuvent être téléchargées via Google Drive shareable links (convertir en export URLs)
- **Higgsfield MCP:** Utiliser les tools:
  - `mcp__Higgsfield__media_upload` pour uploader head/body
  - `mcp__Higgsfield__generate_image` pour générer
  - `mcp__Higgsfield__job_display` pour vérifier le statut

---

## 📝 COMMANDES POUR CLAUDE

Quand tu relances le processus avec Claude, dis:

```
Je veux automatiser la génération d'image carousel Instagram. Voici le processus:

1. Analyser une image Instagram → JSON détaillé (sans features physiques)
2. Générer 1 image originale avec nano_banana_pro (9:16, 2k) en utilisant les références head/body
3. Valider l'image, puis générer les variantes individuellement selon mes demandes
4. Afficher toutes les images directement dans Claude

Voici le contexte complet: [colle ce fichier]
```

---

## 🎯 RÉSUMÉ UNE LIGNE

**Analyser Instagram → Générer 1 image → Valider → Variantes individuelles → Afficher les résultats**
