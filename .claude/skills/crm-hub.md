# CRM Skills Hub

Gestionnaire visuel pour les skills Higgsfield avec tracking des revenus.

## Description

Interface centralisée pour:
- 📊 Voir les revenus en temps réel
- 🎨 Générer des images/vidéos Higgsfield
- 📈 Historique complet des générations
- 💰 Suivi des coûts et crédits

## Utilisation

```
/crm-hub dashboard     # Voir le dashboard complet
/crm-hub generate image "description" [options]
/crm-hub generate video "description" [options]
/crm-hub revenue       # Voir revenus
/crm-hub history       # Historique
```

## Exemple

Générer une image:
```
/crm-hub generate image "a beautiful sunset over mountains"
```

Voir les revenus:
```
/crm-hub revenue
```

## Options

- `--model` - Choisir le modèle
- `--count` - Nombre de générations
- `--aspect-ratio` - Format (16:9, 9:16, 1:1)
- `--duration` - Durée (vidéo)

