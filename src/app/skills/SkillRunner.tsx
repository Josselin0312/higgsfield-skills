"use client";

import { useState } from "react";
import { ArrowLeft, Copy, Check, Loader2, Sparkles, Save } from "lucide-react";
import { type Skill } from "@/lib/skills";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/skills";

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
    if (missing) {
      setError(`Remplis le champ "${missing.label}"`);
      return;
    }

    setError("");
    setLoading(true);
    setOutput("");

    let prompt = skill.prompt;
    skill.inputs.forEach((input) => {
      prompt = prompt.replace(`{${input.id}}`, inputs[input.id] || "");
    });

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux Skills
      </button>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <span className="text-4xl">{skill.icon}</span>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-white">{skill.name}</h2>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${CATEGORY_COLORS[skill.category]}`}>
              {CATEGORY_LABELS[skill.category]}
            </span>
          </div>
          <p className="text-zinc-400">{skill.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">Paramètres</h3>
          {skill.inputs.map((input) => (
            <div key={input.id}>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                {input.label}
              </label>
              {input.type === "select" ? (
                <select
                  value={inputs[input.id] || ""}
                  onChange={(e) => setInputs((prev) => ({ ...prev, [input.id]: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-zinc-500"
                >
                  <option value="">Choisir...</option>
                  {input.options?.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : input.type === "textarea" ? (
                <textarea
                  value={inputs[input.id] || ""}
                  onChange={(e) => setInputs((prev) => ({ ...prev, [input.id]: e.target.value }))}
                  placeholder={input.placeholder}
                  rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-zinc-500 resize-none placeholder-zinc-600"
                />
              ) : (
                <input
                  type="text"
                  value={inputs[input.id] || ""}
                  onChange={(e) => setInputs((prev) => ({ ...prev, [input.id]: e.target.value }))}
                  placeholder={input.placeholder}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-zinc-500 placeholder-zinc-600"
                />
              )}
            </div>
          ))}

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            onClick={handleRun}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-white text-black font-semibold py-3 rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Générer
              </>
            )}
          </button>
        </div>

        {/* Output */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">Résultat</h3>
            {output && (
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copié !" : "Copier"}
                </button>
                <button className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors">
                  <Save className="w-3.5 h-3.5" />
                  Sauvegarder
                </button>
              </div>
            )}
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 min-h-[320px] relative">
            {!output && !loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-zinc-600 text-sm text-center">
                  Remplis les paramètres<br />et clique sur Générer
                </p>
              </div>
            )}
            {loading && !output && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
              </div>
            )}
            {output && (
              <pre className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed font-sans">
                {output}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
