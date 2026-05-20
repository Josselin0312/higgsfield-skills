"use client";

import { useState } from "react";
import { ArrowLeft, Copy, Check, Loader2, Sparkles, Save } from "lucide-react";
import { type Skill } from "@/lib/skills";

const CAT_STYLES: Record<string, React.CSSProperties> = {
  hook: { background: "rgba(255,215,0,0.12)", color: "#ffd700", border: "1px solid rgba(255,215,0,0.3)" },
  caption: { background: "rgba(0,229,255,0.1)", color: "#00e5ff", border: "1px solid rgba(0,229,255,0.25)" },
  script: { background: "rgba(191,0,255,0.1)", color: "#bf80ff", border: "1px solid rgba(191,0,255,0.25)" },
  visual: { background: "rgba(255,45,120,0.1)", color: "#ff2d78", border: "1px solid rgba(255,45,120,0.25)" },
  dm: { background: "rgba(0,255,136,0.1)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.25)" },
};
const CAT_LABELS: Record<string, string> = {
  hook: "Hooks", caption: "Captions", script: "Scripts", visual: "Visuels", dm: "DM",
};

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#150d2a", border: "1px solid rgba(255,215,0,0.18)",
  borderRadius: "12px", padding: "10px 14px", color: "white", fontSize: "14px",
  outline: "none",
};

interface Props {
  skill: Skill;
  onBack: () => void;
}

export default function SkillRunner({ skill, onBack }: Props) {
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const handleRun = async () => {
    const missing = skill.inputs.find((i) => !inputs[i.id]?.trim());
    if (missing) { setError(`Remplis le champ "${missing.label}"`); return; }
    setError(""); setLoading(true); setOutput("");

    let prompt = skill.prompt;
    skill.inputs.forEach((input) => { prompt = prompt.replace(`{${input.id}}`, inputs[input.id] || ""); });

    try {
      const res = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error("Erreur API");
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          setOutput((prev) => prev + decoder.decode(value));
        }
      }
    } catch {
      setError("Erreur lors de la génération. Vérifie ta clé API.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl">
      <button onClick={onBack}
        className="flex items-center gap-2 text-sm font-bold mb-6 transition-colors"
        style={{ color: "rgba(255,215,0,0.5)" }}>
        <ArrowLeft className="w-4 h-4" /> Retour aux Skills
      </button>

      <div className="flex items-center gap-4 mb-8">
        <span className="text-4xl" style={{ filter: "drop-shadow(0 0 12px rgba(255,215,0,0.4))" }}>{skill.icon}</span>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-black text-white">{skill.name}</h2>
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full"
              style={CAT_STYLES[skill.category] ?? {}}>
              {CAT_LABELS[skill.category] ?? skill.category}
            </span>
          </div>
          <p className="text-sm" style={{ color: "rgba(255,215,0,0.45)" }}>{skill.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          <h3 className="text-xs font-black tracking-widest" style={{ color: "rgba(255,215,0,0.4)" }}>♦ PARAMÈTRES</h3>
          {skill.inputs.map((input) => (
            <div key={input.id}>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide"
                style={{ color: "rgba(255,215,0,0.55)" }}>
                {input.label}
              </label>
              {input.type === "select" ? (
                <select value={inputs[input.id] || ""}
                  onChange={(e) => setInputs((prev) => ({ ...prev, [input.id]: e.target.value }))}
                  style={{ ...inputStyle }}>
                  <option value="">Choisir...</option>
                  {input.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : input.type === "textarea" ? (
                <textarea value={inputs[input.id] || ""}
                  onChange={(e) => setInputs((prev) => ({ ...prev, [input.id]: e.target.value }))}
                  placeholder={input.placeholder} rows={3}
                  style={{ ...inputStyle, resize: "none" }} />
              ) : (
                <input type="text" value={inputs[input.id] || ""}
                  onChange={(e) => setInputs((prev) => ({ ...prev, [input.id]: e.target.value }))}
                  placeholder={input.placeholder}
                  style={inputStyle} />
              )}
            </div>
          ))}

          {error && <p className="text-sm font-bold" style={{ color: "#ff2d78" }}>{error}</p>}

          <button onClick={handleRun} disabled={loading}
            className="w-full flex items-center justify-center gap-2 font-black py-3 rounded-xl transition-all text-black disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #ffd700, #ff8c00)", boxShadow: loading ? "none" : "0 0 20px rgba(255,215,0,0.35)" }}>
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin text-black" /> Génération en cours...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Générer ♦</>
            )}
          </button>
        </div>

        {/* Output */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-xs font-black tracking-widest" style={{ color: "rgba(255,215,0,0.4)" }}>♦ RÉSULTAT</h3>
            {output && (
              <div className="flex gap-3">
                <button onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs font-bold transition-colors"
                  style={{ color: copied ? "#00ff88" : "rgba(255,215,0,0.5)" }}>
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copié !" : "Copier"}
                </button>
                <button className="flex items-center gap-1.5 text-xs font-bold transition-colors"
                  style={{ color: "rgba(255,215,0,0.5)" }}>
                  <Save className="w-3.5 h-3.5" /> Sauvegarder
                </button>
              </div>
            )}
          </div>
          <div className="rounded-2xl p-4 min-h-[320px] relative"
            style={{ background: "#140e28", border: "1px solid rgba(255,215,0,0.12)" }}>
            {!output && !loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <span className="text-3xl" style={{ filter: "drop-shadow(0 0 10px rgba(255,215,0,0.2))" }}>♠</span>
                <p className="text-xs text-center font-bold" style={{ color: "rgba(255,215,0,0.2)" }}>
                  Remplis les paramètres<br />et clique sur Générer
                </p>
              </div>
            )}
            {loading && !output && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#ffd700" }} />
              </div>
            )}
            {output && (
              <pre className="text-sm leading-relaxed font-sans whitespace-pre-wrap" style={{ color: "rgba(255,255,255,0.9)" }}>
                {output}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
