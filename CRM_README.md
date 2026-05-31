# 🎨 CRM Skills Hub

Dashboard visuel centralisé pour gérer et tracker les Higgsfield skills avec analyse des revenus.

## 🚀 Démarrage rapide

```bash
# Voir le dashboard
node crm-dashboard.js dashboard

# Voir les revenus
node crm-dashboard.js revenue

# Voir l'historique
node crm-dashboard.js history
```

## 📊 Features

### Dashboard Principal
- 💰 Revenus totaux par skill
- 📈 Nombre de générations
- 📉 Coût moyen par génération
- 🔄 Historique complet

### Skills Intégrés
- 🖼️ **Image Generation** - nano_banana_2, gpt_image_2, seedream_v5_lite
- 🎬 **Video Generation** - kling3_0, seedance_2_0, marketing_studio_video
- 📹 **Analysis** - Video analysis, Virality prediction

### Data Tracking
- ✅ Historique des générations
- 💳 Coûts par génération
- 📍 Modèles utilisés
- ⏰ Timestamps

## 📁 Structure

```
├── crm-dashboard.js      # CLI principal
├── crm-data.json         # Base de données locale
├── crm-skills-hub.md     # Documentation visuelle
└── CRM_README.md         # Ce fichier
```

## 🎯 Prochaines étapes

- [ ] Intégration Higgsfield complète
- [ ] Interface web optionnelle
- [ ] Export des données (CSV, PDF)
- [ ] Prévisions de revenus
- [ ] Notifications de limite de credits

## 💡 Utilisation

### Générer une image
```
node crm-dashboard.js generate image "sunset mountain"
```

### Suivre les revenus
```
node crm-dashboard.js revenue
```

### Analyser les données
```
node crm-dashboard.js history
```

---

**Version**: 1.0  
**Status**: 🧪 Testing Phase
