# CRM Skills Hub - Documentation

## Vue d'ensemble

Le **CRM Skills Hub** est une interface centralisée pour gérer les Higgsfield skills (image generation, video generation, analysis tools) avec un focus sur le **tracking des revenus** et la **gestion des générations**.

C'est un dashboard professionnel type SaaS conçu pour :
- 💰 Tracker les revenus en temps réel
- 🎨 Gérer les générations (images, vidéos, analyses)
- 💬 Intégrer les messages (Instagram)

---

## Architecture

### Structure Technique

```
higgsfield-skills/
├── crm-preview.html          # Dashboard UI (interface visuelle)
├── crm-dashboard.js          # CLI tool (affichage terminal)
├── crm-data.json             # Base de données locale (JSON)
├── .claude/
│   ├── agents/
│   │   └── crm.md           # Agent @crm pour Claude Code
│   └── skills/
│       ├── crm.md           # Skill /crm CLI
│       └── crm.sh           # Script shell helper
└── CLAUDE.md                 # Documentation (ce fichier)
```

### Composants

#### 1. **Dashboard HTML (crm-preview.html)**
Interface web moderne avec :
- **Sidebar** : Navigation avec Money, Génération, Message
- **Money View** : Affiche le Revenue ($0.00 au départ)
- **Génération View** : Placeholder vide
- **Message View** : Placeholder vide (pour Instagram)

**Design** :
- Fond noir (#0a0a0a)
- Texte blanc
- Accents rouges (#dc2626)
- Responsive et minimaliste

#### 2. **Base de Données (crm-data.json)**
Stocke les données persistantes :
```json
{
  "revenue": {
    "total": 0,
    "by_skill": {
      "generate_image": 0,
      "generate_video": 0,
      "video_analysis": 0,
      "virality_predictor": 0
    }
  },
  "generations": {
    "total": 0,
    "image": 0,
    "video": 0,
    "analysis": 0
  },
  "history": []
}
```

#### 3. **CLI Dashboard (crm-dashboard.js)**
Outil Node.js pour afficher les données en terminal :
```bash
node crm-dashboard.js dashboard   # Afficher le dashboard
node crm-dashboard.js revenue     # Détail des revenus
node crm-dashboard.js history     # Historique des générations
```

#### 4. **Agent @crm**
Skill Claude Code invocable avec `@crm` pour :
- Afficher le dashboard
- Gérer les revenus
- Intégrer les générations Higgsfield

---

## Sections et Utilité

### 💰 Money
**Affiche** : Revenue total en temps réel

**Utilité** :
- Voir l'argent généré par les skills
- Tracker les revenues par modèle/skill
- Vue d'ensemble des finances

**À développer** :
- Graphiques de tendances
- Breakdown par skill
- Export CSV/PDF

### 🎨 Génération
**Affiche** : Vide pour l'instant

**Utilité future** :
- Lancer des générations (images, vidéos)
- Sélectionner le modèle et les paramètres
- Voir l'historique des générations
- Tracker les coûts en credits

**À développer** :
- Interface pour générer du contenu
- Intégration MCP tools Higgsfield
- Queue des générations

### 💬 Message
**Affiche** : Vide pour l'instant

**Utilité future** :
- Afficher les messages Instagram
- Répondre aux messages
- Analytics des messages

**À développer** :
- Connexion API Instagram
- Synchronisation en temps réel
- Thread messaging

---

## Flux de Données

```
┌─────────────────────────────────────┐
│      Dashboard (crm-preview.html)   │
│  Money | Génération | Message       │
└─────────────┬───────────────────────┘
              │
              ├─→ Affiche crm-data.json
              │
              └─→ Mise à jour via API
                    ↓
            ┌──────────────────┐
            │  crm-data.json   │
            │  (Persistance)   │
            └──────────────────┘
```

### Workflows

**Workflow Money** :
1. User clique sur "Money"
2. Dashboard charge crm-data.json
3. Affiche le Revenue total

**Workflow Génération** (à implémenter) :
1. User clique sur "Génération"
2. Sélectionne un modèle (image, video)
3. Entre les paramètres
4. Lance la génération via MCP tools Higgsfield
5. Sauvegarde le coût dans crm-data.json
6. Met à jour le Money view

**Workflow Message** (à implémenter) :
1. User clique sur "Message"
2. API Instagram synchronise les messages
3. Affiche les conversations

---

## Utilisation

### Ouvrir le Dashboard
```bash
# Fichier HTML (navigateur)
open crm-preview.html

# Ou CLI
node crm-dashboard.js dashboard

# Ou Claude Code Agent
@crm show dashboard
```

### Naviguer
- **Cliquer sur "Money"** → Voir les revenus
- **Cliquer sur "Génération"** → (À venir)
- **Cliquer sur "Message"** → (À venir)

---

## Technologies Utilisées

- **Frontend** : HTML5, CSS3, JavaScript (vanilla)
- **Backend** : Node.js, JSON
- **Database** : JSON local (crm-data.json)
- **Integration** : MCP tools Higgsfield (futur)
- **UI Framework** : Minimaliste custom (pas de libs)

---

## Prochaines Étapes

### Phase 1️⃣ (MVP - Fonctionnel)
- [x] Dashboard UI créé
- [x] Sidebar navigation
- [x] Money view avec Revenue
- [ ] Connecter crm-data.json au UI

### Phase 2️⃣ (Générations)
- [ ] Interface Génération
- [ ] Intégration MCP tools Higgsfield
- [ ] Auto-tracking des coûts
- [ ] Historique des générations

### Phase 3️⃣ (Messages)
- [ ] Connexion API Instagram
- [ ] Affichage des messages
- [ ] Analytics messages

### Phase 4️⃣ (Polish)
- [ ] Graphiques et charts
- [ ] Export données
- [ ] Notifications
- [ ] Dark/Light mode toggle

---

## Fichiers Importants

| Fichier | Rôle | Priorité |
|---------|------|----------|
| crm-preview.html | UI Dashboard | 🔴 Critique |
| crm-data.json | Persistance données | 🔴 Critique |
| crm-dashboard.js | CLI tool | 🟡 Important |
| .claude/agents/crm.md | Agent Claude | 🟡 Important |
| .claude/skills/crm.md | Skill CLI | 🟢 Nice to have |

---

## Notes Développement

### Design
- **Dark mode** : #0a0a0a (bg), #ffffff (text), #dc2626 (accent)
- **Responsive** : Grid layout adaptatif
- **Performance** : Chargement rapide, pas de framework lourd

### Code Style
- Vanilla JS (pas de dépendances)
- HTML sémantique
- CSS moderne (flexbox, grid)

### Sécurité
- Données stockées localement (crm-data.json)
- Pas d'authentification pour l'instant
- À implémenter : API keys, authentification utilisateur

---

**Le CRM Skills Hub est un projet en cours de développement. Toute contribution est bienvenue!** 🚀

@AGENTS.md
