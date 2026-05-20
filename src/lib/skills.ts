export type SkillCategory = "hook" | "caption" | "script" | "visual" | "dm";

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  icon: string;
  prompt: string;
  inputs: SkillInput[];
}

export interface SkillInput {
  id: string;
  label: string;
  placeholder: string;
  type: "text" | "textarea" | "select";
  options?: string[];
}

export const SKILLS: Skill[] = [
  {
    id: "hook-generator",
    name: "Générateur de Hooks",
    description: "Crée des accroches percutantes pour tes Reels",
    category: "hook",
    icon: "⚡",
    prompt: `Tu es expert en copywriting Instagram. Génère 5 hooks ultra-percutants pour un Reel sur le sujet suivant : {sujet}.
    Ton objectif : {objectif}.
    Style : {style}.

    Format : Une liste numérotée de 5 hooks courts (max 2 lignes chacun), direct, qui donnent envie de regarder la suite.
    Commence chaque hook par un chiffre ou une affirmation forte.`,
    inputs: [
      { id: "sujet", label: "Sujet du Reel", placeholder: "ex: comment faire 10k€/mois en freelance", type: "textarea" },
      { id: "objectif", label: "Objectif", placeholder: "ex: vendre ma formation, attirer des leads", type: "text" },
      { id: "style", label: "Style", placeholder: "", type: "select", options: ["Choquant / Controversé", "Curiosité / Mystère", "Résultat concret", "Erreur commune", "Témoignage perso"] },
    ],
  },
  {
    id: "caption-writer",
    name: "Rédacteur de Captions",
    description: "Écrit des captions engageantes qui convertissent",
    category: "caption",
    icon: "✍️",
    prompt: `Tu es copywriter Instagram spécialisé en acquisition. Écris une caption Instagram pour le post suivant.

    Sujet : {sujet}
    Call to action : {cta}
    Ton : {ton}

    Structure :
    - 1ère ligne = hook fort (stop scroll)
    - Corps : valeur + histoire courte
    - CTA clair en fin
    - 5-10 hashtags pertinents

    Maximum 300 mots. Utilise des sauts de ligne pour la lisibilité.`,
    inputs: [
      { id: "sujet", label: "Sujet du post", placeholder: "ex: ma transformation en 6 mois", type: "textarea" },
      { id: "cta", label: "Call to Action", placeholder: "ex: envoie moi 'INFO' en DM, commente 'oui'", type: "text" },
      { id: "ton", label: "Ton", placeholder: "", type: "select", options: ["Authentique / Perso", "Expert / Autorité", "Motivant / Inspirant", "Direct / Cash", "Storytelling"] },
    ],
  },
  {
    id: "reel-script",
    name: "Script Reel",
    description: "Génère un script complet pour tes Reels",
    category: "script",
    icon: "🎬",
    prompt: `Tu es scénariste de Reels Instagram viraux. Crée un script complet pour un Reel de {duree} secondes.

    Sujet : {sujet}
    Message clé : {message}

    Format du script :
    [0-3s] HOOK : ...
    [3-Xs] DÉVELOPPEMENT : ...
    [Xs-fin] CTA : ...

    Inclus : ce que dit la personne à l'écran, les textes à afficher, les transitions suggérées.
    Rends-le concret, dynamique, avec rythme. Max 150 mots à l'écran.`,
    inputs: [
      { id: "sujet", label: "Sujet du Reel", placeholder: "ex: les 3 erreurs qui m'ont coûté 50k€", type: "textarea" },
      { id: "message", label: "Message clé à faire passer", placeholder: "ex: les gens perdent de l'argent par impatience", type: "text" },
      { id: "duree", label: "Durée (secondes)", placeholder: "", type: "select", options: ["15", "30", "45", "60", "90"] },
    ],
  },
  {
    id: "dm-opener",
    name: "Opener DM",
    description: "Messages d'accroche pour démarrer une conversation",
    category: "dm",
    icon: "💬",
    prompt: `Tu es expert en acquisition par DM Instagram. Génère 5 openers naturels et non-salesy pour démarrer une conversation avec un prospect.

    Profil du prospect : {profil}
    Contexte (d'où vient-il ?) : {contexte}
    Objectif de la conversation : {objectif}

    Les messages doivent être :
    - Très courts (1-2 phrases max)
    - Personnalisés et authentiques
    - Pas de pitch commercial direct
    - Donnent envie de répondre

    Format : liste numérotée de 5 messages.`,
    inputs: [
      { id: "profil", label: "Profil du prospect", placeholder: "ex: entrepreneur 30-40 ans, cherche à scaler", type: "text" },
      { id: "contexte", label: "Contexte", placeholder: "ex: a commenté mon post, a regardé mon Reel", type: "text" },
      { id: "objectif", label: "Objectif", placeholder: "ex: qualifier et proposer un appel", type: "text" },
    ],
  },
  {
    id: "visual-prompt",
    name: "Prompt Visuel IA",
    description: "Génère des prompts pour créer des visuels Instagram avec l'IA",
    category: "visual",
    icon: "🎨",
    prompt: `Tu es expert en prompt engineering pour la génération d'images IA (Midjourney / DALL-E).
    Crée 3 prompts détaillés pour générer un visuel Instagram professionnel.

    Type de contenu : {type}
    Ambiance / Style : {ambiance}
    Éléments à inclure : {elements}

    Format pour chaque prompt :
    - Description visuelle précise
    - Style artistique
    - Éclairage
    - Couleurs dominantes
    - Format : portrait 9:16 pour Instagram Stories/Reels

    Écris les prompts en anglais (pour les outils IA).`,
    inputs: [
      { id: "type", label: "Type de visuel", placeholder: "", type: "select", options: ["Portrait / Personal Brand", "Lifestyle / Aspiration", "Résultats / Before-After", "Citation / Motivation", "Produit / Offre"] },
      { id: "ambiance", label: "Ambiance", placeholder: "ex: luxe moderne, authentique, professionnel", type: "text" },
      { id: "elements", label: "Éléments à inclure", placeholder: "ex: homme en costume, bureau moderne, lumière naturelle", type: "text" },
    ],
  },
  {
    id: "follow-up-dm",
    name: "Follow-up DM",
    description: "Messages de relance pour les prospects silencieux",
    category: "dm",
    icon: "🔄",
    prompt: `Tu es expert en closing par DM Instagram. Génère 5 messages de follow-up pour relancer un prospect.

    Dernier message envoyé : {dernier_message}
    Jours depuis la dernière réponse : {jours}
    Stade dans le funnel : {stade}

    Les messages doivent être :
    - Naturels, pas désespérés
    - Apporter de la valeur ou créer de la curiosité
    - Avoir un prétexte logique pour relancer
    - Courts (2-3 lignes max)

    Format : liste numérotée de 5 messages.`,
    inputs: [
      { id: "dernier_message", label: "Contexte de la conversation", placeholder: "ex: il était intéressé mais a disparu après que j'aie parlé du prix", type: "textarea" },
      { id: "jours", label: "Délai", placeholder: "", type: "select", options: ["1-2 jours", "3-5 jours", "1 semaine", "+2 semaines"] },
      { id: "stade", label: "Stade dans le funnel", placeholder: "", type: "select", options: ["Premier contact", "Qualification", "Présentation offre", "Négociation", "Décision"] },
    ],
  },
];

export const CATEGORY_LABELS: Record<SkillCategory, string> = {
  hook: "Hooks",
  caption: "Captions",
  script: "Scripts",
  visual: "Visuels",
  dm: "DM",
};

export const CATEGORY_COLORS: Record<SkillCategory, string> = {
  hook: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  caption: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  script: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  visual: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  dm: "bg-green-500/20 text-green-400 border-green-500/30",
};
