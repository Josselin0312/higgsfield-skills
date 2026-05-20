"use client";

import { useState } from "react";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { type Skill, type SkillInput, type SkillCategory, CATEGORY_LABELS } from "@/lib/skills";
import { useSkills } from "@/lib/skillsStore";

interface Props {
  skill: Skill | null;
  onBack: () => void;
}

const EMOJIS = ["⚡", "✍️", "🎬", "💬", "🎨", "🔄", "🔥", "💡", "🚀", "📱", "💰", "🎯", "📣", "🤝", "✨"];
const CATEGORIES: SkillCategory[] = ["hook", "caption", "script", "visual", "dm"];

const CAT_STYLES: Record<SkillCategory, React.CSSProperties> = {
  hook: { background: "rgba(255,215,0,0.12)", color: "#ffd700", border: "1px solid rgba(255,215,0,0.3)" },
  caption: { background: "rgba(0,229,255,0.1)", color: "#00e5ff", border: "1px solid rgba(0,229,255,0.25)" },
  script: { background: "rgba(191,0,255,0.1)", color: "#bf80ff", border: "1px solid rgba(191,0,255,0.25)" },
  visual: { background: "rgba(255,45,120,0.1)", color: "#ff2d78", border: "1px solid rgba(255,45,120,0.25)" },
  dm: { background: "rgba(0,255,136,0.1)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.25)" },
};

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#150d2a", border: "1px solid rgba(255,215,0,0.18)",
  borderRadius: "12px", padding: "10px 14px", color: "white", fontSize: "14px", outline: "none",
};

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
      name: name.trim(), description: description.trim(), category, icon,
      prompt: prompt.trim(), inputs: inputs.filter((i) => i.label.trim()),
    };
    isNew ? addSkill(s) : updateSkill(s);
    onBack();
  };

  const updateInput = (idx: number, key: keyof SkillInput, value: string) => {
    setInputs((prev) => prev.map((inp, i) => i === idx ? { ...inp, [key]: value } : inp));
  };

  return (
    <div className="p-8 max-w-2xl h-full overflow-y-auto" style={{ background: "#07050e" }}>
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold mb-6 transition-colors"
        style={{ color: "rgba(255,215,0,0.5)" }}>
        <ArrowLeft className="w-4 h-4" /> Retour aux Skills
      </button>

      <h2 className="text-2xl font-black mb-6"
        style={{ background: "linear-gradient(135deg, #ffd700, #ff8c00)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        {isNew ? "♦ Créer un Skill" : "♦ Modifier le Skill"}
      </h2>

      <div className="space-y-5">
        {/* Icon + Name */}
        <div className="flex gap-3">
          <div>
            <label className="block text-[10px] font-black tracking-widest mb-1.5 uppercase" style={{ color: "rgba(255,215,0,0.4)" }}>Icône</label>
            <select value={icon} onChange={(e) => setIcon(e.target.value)}
              style={{ ...inputStyle, width: "72px", textAlign: "center", fontSize: "20px", padding: "8px" }}>
              {EMOJIS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-black tracking-widest mb-1.5 uppercase" style={{ color: "rgba(255,215,0,0.4)" }}>Nom du Skill</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="ex: Générateur de Hooks" style={inputStyle} />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-[10px] font-black tracking-widest mb-2 uppercase" style={{ color: "rgba(255,215,0,0.4)" }}>Catégorie</label>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => setCategory(cat)}
                className="px-3 py-1.5 rounded-full text-xs font-black transition-all"
                style={category === cat ? CAT_STYLES[cat] : { border: "1px solid rgba(255,215,0,0.15)", color: "rgba(255,215,0,0.35)" }}>
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-[10px] font-black tracking-widest mb-1.5 uppercase" style={{ color: "rgba(255,215,0,0.4)" }}>Description courte</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="ex: Crée des accroches percutantes pour tes Reels" style={inputStyle} />
        </div>

        {/* Prompt */}
        <div>
          <label className="block text-[10px] font-black tracking-widest mb-1.5 uppercase" style={{ color: "rgba(255,215,0,0.4)" }}>
            Prompt IA <span className="ml-1 normal-case font-normal text-[10px]" style={{ color: "rgba(255,215,0,0.25)" }}>utilise {"{nom_champ}"} pour insérer les valeurs</span>
          </label>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={8}
            placeholder="Tu es expert en copywriting Instagram. Génère 5 hooks pour {sujet}..."
            style={{ ...inputStyle, resize: "none", fontFamily: "monospace" }} />
        </div>

        {/* Inputs */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-black tracking-widest uppercase" style={{ color: "rgba(255,215,0,0.4)" }}>Champs de saisie</label>
            <button onClick={() => setInputs((prev) => [...prev, newInput()])}
              className="flex items-center gap-1.5 text-xs font-bold transition-colors"
              style={{ color: "rgba(255,215,0,0.6)" }}>
              <Plus className="w-3.5 h-3.5" /> Ajouter
            </button>
          </div>
          <div className="space-y-3">
            {inputs.map((inp, idx) => (
              <div key={inp.id} className="flex gap-2 items-start p-3 rounded-xl"
                style={{ background: "#140e28", border: "1px solid rgba(255,215,0,0.1)" }}>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <input value={inp.label} onChange={(e) => updateInput(idx, "label", e.target.value)}
                    placeholder="Label (ex: Sujet)" style={{ ...inputStyle, padding: "8px 12px" }} />
                  <select value={inp.type} onChange={(e) => updateInput(idx, "type", e.target.value)}
                    style={{ ...inputStyle, padding: "8px 12px" }}>
                    <option value="text">Texte court</option>
                    <option value="textarea">Texte long</option>
                    <option value="select">Liste de choix</option>
                  </select>
                  <input value={inp.placeholder} onChange={(e) => updateInput(idx, "placeholder", e.target.value)}
                    placeholder="Placeholder / options séparées par des virgules"
                    style={{ ...inputStyle, padding: "8px 12px", gridColumn: "span 2" }} />
                </div>
                <button onClick={() => setInputs((prev) => prev.filter((_, i) => i !== idx))}
                  className="p-2 transition-colors hover:text-red-400 mt-0.5"
                  style={{ color: "rgba(255,45,120,0.5)" }}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-sm font-bold" style={{ color: "#ff2d78" }}>{error}</p>}

        <button onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 font-black py-3 rounded-xl transition-all text-black"
          style={{ background: "linear-gradient(135deg, #ffd700, #ff8c00)", boxShadow: "0 0 20px rgba(255,215,0,0.3)" }}>
          <Save className="w-4 h-4" />
          {isNew ? "Créer le Skill ♦" : "Sauvegarder ♦"}
        </button>
      </div>
    </div>
  );
}
