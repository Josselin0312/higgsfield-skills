"use client";

import { useState } from "react";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { type Skill, type SkillInput, type SkillCategory, CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/skills";
import { useSkills } from "@/lib/skillsStore";

interface Props {
  skill: Skill | null;
  onBack: () => void;
}

const EMOJIS = ["⚡", "✍️", "🎬", "💬", "🎨", "🔄", "🔥", "💡", "🚀", "📱", "💰", "🎯", "📣", "🤝", "✨"];
const CATEGORIES: SkillCategory[] = ["hook", "caption", "script", "visual", "dm"];

function newInput(): SkillInput {
  return { id: Date.now().toString(), label: "", placeholder: "", type: "text" };
}

export default function SkillEditor({ skill, onBack }: Props) {
  const { addSkill, updateSkill } = useSkills();
  const isNew = skill === null;

  const [name, setName] = useState(skill?.name ?? "");
  const [description, setDescription] = useState(skill?.description ?? "");
  const [category, setCategory] = useState<SkillCategory>(skill?.category ?? "hook");
  const [icon, setIcon] = useState(skill?.icon ?? "⚡");
  const [prompt, setPrompt] = useState(skill?.prompt ?? "");
  const [inputs, setInputs] = useState<SkillInput[]>(skill?.inputs ?? [newInput()]);
  const [error, setError] = useState("");

  const handleSave = () => {
    if (!name.trim()) { setError("Nom obligatoire"); return; }
    if (!prompt.trim()) { setError("Prompt obligatoire"); return; }

    const s: Skill = {
      id: skill?.id ?? `skill-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      category,
      icon,
      prompt: prompt.trim(),
      inputs: inputs.filter((i) => i.label.trim()),
    };

    isNew ? addSkill(s) : updateSkill(s);
    onBack();
  };

  const updateInput = (idx: number, key: keyof SkillInput, value: string) => {
    setInputs((prev) => prev.map((inp, i) => i === idx ? { ...inp, [key]: value } : inp));
  };

  const removeInput = (idx: number) => setInputs((prev) => prev.filter((_, i) => i !== idx));

  return (
    <div className="p-8 max-w-2xl">
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" />
        Retour aux Skills
      </button>

      <h2 className="text-2xl font-bold text-white mb-6">
        {isNew ? "Créer un Skill" : "Modifier le Skill"}
      </h2>

      <div className="space-y-5">
        {/* Icon + Name */}
        <div className="flex gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Icône</label>
            <select
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-xl focus:outline-none focus:border-zinc-500 w-20 text-center"
            >
              {EMOJIS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Nom du Skill</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Générateur de Hooks"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-zinc-500 placeholder-zinc-600"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Catégorie</label>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  category === cat ? CATEGORY_COLORS[cat] : "border-zinc-700 text-zinc-500 hover:text-white"
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Description courte</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="ex: Crée des accroches percutantes pour tes Reels"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-zinc-500 placeholder-zinc-600"
          />
        </div>

        {/* Prompt */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">
            Prompt IA
            <span className="ml-2 text-zinc-600 normal-case font-normal">utilise {"{nom_champ}"} pour insérer les valeurs</span>
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={8}
            placeholder="Tu es expert en copywriting Instagram. Génère 5 hooks pour {sujet}..."
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-zinc-500 resize-none placeholder-zinc-600 font-mono"
          />
        </div>

        {/* Inputs */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wide">Champs de saisie</label>
            <button
              onClick={() => setInputs((prev) => [...prev, newInput()])}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Ajouter un champ
            </button>
          </div>
          <div className="space-y-3">
            {inputs.map((inp, idx) => (
              <div key={inp.id} className="flex gap-2 items-start bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <input
                    value={inp.label}
                    onChange={(e) => updateInput(idx, "label", e.target.value)}
                    placeholder="Label (ex: Sujet)"
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none placeholder-zinc-600"
                  />
                  <select
                    value={inp.type}
                    onChange={(e) => updateInput(idx, "type", e.target.value)}
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value="text">Texte court</option>
                    <option value="textarea">Texte long</option>
                    <option value="select">Liste de choix</option>
                  </select>
                  <input
                    value={inp.placeholder}
                    onChange={(e) => updateInput(idx, "placeholder", e.target.value)}
                    placeholder="Placeholder / options (séparées par des virgules)"
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none placeholder-zinc-600 col-span-2"
                  />
                </div>
                <button
                  onClick={() => removeInput(idx)}
                  className="p-2 text-zinc-600 hover:text-red-400 transition-colors mt-0.5"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 bg-white text-black font-semibold py-3 rounded-xl hover:bg-zinc-200 transition-colors"
        >
          <Save className="w-4 h-4" />
          {isNew ? "Créer le Skill" : "Sauvegarder"}
        </button>
      </div>
    </div>
  );
}
