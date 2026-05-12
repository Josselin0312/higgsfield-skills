# JSON de référence validés

Ces exemples ont produit des résultats de haute qualité avec Nano Banana Pro.
Ils servent de templates et d'étalon de qualité.

---

## Exemple 1 — Car selfie (portrait beauté)

Situation : selfie dans une voiture de sport, ceinture jaune, lumière naturelle, expression calme.

```json
{
  "image_type": "car selfie / beauty portrait",
  "orientation": "vertical",
  "composition": {
    "shot_type": "close-up to upper-torso portrait",
    "camera_style": "front-facing smartphone selfie",
    "angle": "slightly above chest level, facing the subject at a mild side angle",
    "framing": "subject occupies most of the frame, seated in a car with head, shoulders, upper chest, and part of the seat visible",
    "focus_priority": ["face and expression", "makeup and eyeliner", "minimal top", "car interior context"]
  },
  "scene": {
    "type": "inside_sports_car",
    "setting": "passenger_seat_daytime",
    "lighting": {
      "type": "natural daylight",
      "quality": "soft, bright, even",
      "direction": "primarily from the window side",
      "effect": "creates a smooth glow on the face, highlights cheekbones"
    },
    "atmosphere": ["quiet", "polished", "beauty-focused", "calm", "social-media-ready"]
  },
  "facial_expression": {
    "overall_expression": "soft serious expression with a mild pout",
    "eyes": "gaze directed to the side rather than straight at the lens",
    "mouth_and_tongue": "lips closed and gently projected forward",
    "emotional_tone": "calm, poised, slightly dreamy, self-aware, subtly sultry"
  },
  "outfit": {
    "top": {
      "type": "ribbed zip-up long sleeve top",
      "fit": "close-fitting",
      "color": "dark charcoal grey",
      "features": ["front zipper", "high neckline", "ribbed texture"]
    }
  },
  "accessories": {
    "seatbelt": "bright yellow seatbelt crossing diagonally from shoulder to hip",
    "jewelry": [{"type": "small hoop earring", "material_appearance": "minimal metal hoop"}]
  },
  "overall_mood": "beauty-first portraiture, natural-light selfie, calm poised mood",
  "photography_style": "social media lifestyle selfie",
  "image_quality": {"resolution": "high", "sharpness": "sharp face", "exposure": "well balanced"}
}
```

---

## Exemple 2 — Expression dynamique (langue tirée, clin d'œil)

Situation : selfie voiture, expression joueuse et énergique.

```json
{
  "facial_expression": {
    "overall_expression": "Playful, cheeky, and energetic selfie-style portrait with a strong sense of fun and confidence.",
    "eyes": "Left eye is fully closed in a pronounced wink. Right eye is wide open, looking straight at the camera with a bright, engaging gaze.",
    "mouth_and_tongue": "Mouth is open wide in an exaggerated expression. The tongue is fully extended outward, flat and relaxed, reaching beyond the lower lip. Upper teeth are visible.",
    "cheeks_and_nose": "Cheeks are lifted and rounded, particularly on the left side due to the wink and smile.",
    "head_tilt_and_angle": "Head is tilted slightly to the subject's right, adding dynamism and playfulness.",
    "emotional_tone": "High-energy mischief, flirtatious fun, and lighthearted rebellion. Bold, youthful.",
    "muscle_engagement": "Strong activation of orbicularis oculi (winking eye), zygomaticus major (cheek lift/smile), depressor labii inferioris for the tongue-out gesture."
  }
}
```

---

## Exemple 3 — Outdoor / Ranch lifestyle

Situation : extérieur, clôture en bois, lumière directe, tenue cosy.

```json
{
  "scene": {
    "type": "outdoor_farm_ranch",
    "setting": "fence_line_paddock",
    "time_of_day": "daytime_bright_midday",
    "lighting": {
      "type": "natural_direct_sunlight",
      "direction": "overhead_slightly_behind_subject",
      "quality": "bright_harsh_high_contrast"
    },
    "background": {
      "sky": "clear_deep_blue_no_clouds",
      "fence": {"type": "wooden_post_and_rail", "condition": "aged_weathered_grey"}
    }
  },
  "outfit": {
    "top": {
      "type": "chunky_knit_sweater",
      "style": "oversized_off_shoulder",
      "color": {"primary": "soft_pastel_pink", "secondary": "pastel_blue_lavender", "pattern": "color_block_horizontal_stripes"},
      "fabric_texture": "thick_chunky_wool_knit",
      "fit": "oversized_relaxed_draped",
      "neckline": "wide_off_shoulder_bardot_style"
    },
    "bottom": {"type": "jeans_denim", "color": "light_to_mid_blue_wash", "fit": "straight_or_slim"}
  },
  "overall_mood": "warm_pastoral_romantic_lifestyle_country_chic",
  "photography_style": "lifestyle_portrait_golden_natural_light"
}
```

---

## Exemple 4 — Indoor low-angle selfie (streetwear editorial)

Situation : intérieur moderne, selfie angle bas, look cropped top + jean taille basse.

```json
{
  "scene": {
    "type": "indoor_residential",
    "setting": "interior_wall_selfie_low_angle",
    "lighting": {"type": "soft_ambient_indoor", "quality": "warm_soft_even_flattering"}
  },
  "composition": {
    "shot_type": "upper_body_to_hip",
    "angle": "low_angle_looking_upward_at_subject",
    "selfie_type": "arm_extended_downward_low_angle_self_shot"
  },
  "outfit": {
    "top": {
      "style": "baby_tee_cropped_t_shirt",
      "fabric": {"type": "ribbed_cotton_jersey"},
      "color": "deep_burgundy_wine_red_dark_maroon",
      "fit": "very_fitted_tight_body_hugging",
      "hem": {"position": "sits_several_inches_above_navel_very_cropped"}
    },
    "bottom": {
      "style": "low_rise_denim_jeans",
      "color": "light_to_mid_blue_wash",
      "waistband": {"rise": "low_rise"}
    },
    "midriff": {"exposed": true}
  },
  "overall_mood": "confident_editorial_casual_streetwear_bold",
  "photography_style": "social_media_selfie_fashion_lifestyle"
}
```

---

## Bonnes pratiques de prompt

### Ce qui fonctionne bien
- Décrire la **texture exacte** des vêtements (ribbed, chunky knit, feather trim, etc.)
- Préciser la **direction du regard** (straight at camera / to the side / downward)
- Détailler la **qualité de lumière** (harsh vs soft, direction, effet sur la peau)
- Inclure les **éléments d'environnement** (seatbelt color, seat material, background elements)
- Décrire **muscle_engagement** pour les expressions faciales complexes

### Ce qu'il faut éviter
- Décrire la couleur des cheveux, des yeux, ou les traits physiques du modèle
- Prompts trop courts (moins de 300 mots = résultats inconsistants)
- Oublier les tattoos si visibles sur les refs (brise la cohérence identitaire)
- Lumières trop "parfaites" ou "studio" sauf demande spécifique
