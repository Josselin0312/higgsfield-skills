"use client";

import { useState } from "react";
import { useSkills } from "@/lib/skillsStore";
import SkillRunner from "@/app/skills/SkillRunner";
import type { Skill } from "@/lib/skills";
import { Clock, ArrowLeft } from "lucide-react";

type GenSection = "feed" | "reels" | "script";

const SECTION_CATEGORIES: Record<GenSection, string[]> = {
  feed: ["caption", "visual", "hook"],
  reels: ["hook", "script", "visual"],
  script: ["script", "hook"],
};

const SECTION_CONFIG = [
  { key: "feed" as GenSection, label: "Feed", icon: "♦", desc: "Posts & Captions" },
  { key: "reels" as GenSection, label: "Reels", icon: "♠", desc: "Hooks & Scripts" },
  { key: "script" as GenSection, label: "Script", icon: "♣", desc: "Scripts seuls" },
];

const CASINO_CAT_STYLES: Record<string, React.CSSProperties> = {
  hook: { background: "rgba(255,215,0,0.12)", color: "#ffd700", border: "1px solid rgba(255,215,0,0.3)" },
  caption: { background: "rgba(0,229,255,0.1)", color: "#00e5ff", border: "1px solid rgba(0,229,255,0.25)" },
  script: { background: "rgba(191,0,255,0.1)", color: "#bf80ff", border: "1px solid rgba(191,0,255,0.25)" },
  visual: { background: "rgba(255,45,120,0.1)", color: "#ff2d78", border: "1px solid rgba(255,45,120,0.25)" },
};

export default function GenerationPage() {
  const { skills } = useSkills();
  const [activeSection, setActiveSection] = useState<GenSection>("feed");
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  const visibleSkills = skills.filter((s) => SECTION_CATEGORIES[activeSection].includes(s.category));

  if (selectedSkill) {
    return (
      <div className="h-full overflow-y-auto p-8" style={{ background: "#07050e" }}>
        <button onClick={() => setSelectedSkill(null)}
          className="flex items-center gap-2 text-sm font-bold mb-6 transition-colors"
          style={{ color: "rgba(255,215,0,0.6)" }}>
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        <SkillRunner skill={selectedSkill} onBack={() => setSelectedSkill(null)} />
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden" style={{ background: "#07050e" }}>
      {/* Sub-nav */}
      <div className="w-52 flex-shrink-0 py-5 px-3"
        style={{ background: "#0a0618", borderRight: "1px solid rgba(255,215,0,0.1)" }}>

        {/* IMAGES section */}
        <p className="text-[10px] font-black tracking-[0.18em] mb-3 px-2"
          style={{ color: "rgba(255,215,0,0.35)" }}>♦ IMAGES</p>
        <div className="space-y-0.5 mb-6">
          {SECTION_CONFIG.map(({ key, label, icon, desc }) => (
            <button key={key} onClick={() => setActiveSection(key)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
              style={activeSection === key ? {
                background: "rgba(255,215,0,0.07)",
                borderLeft: "2px solid #ffd700",
                color: "#ffd700",
              } : {
                color: "rgba(255,215,0,0.38)",
                borderLeft: "2px solid transparent",
              }}>
              <span className="text-sm flex-shrink-0">{icon}</span>
              <div>
                <p className="text-sm font-black">{label}</p>
                <p className="text-[10px]" style={{ color: "rgba(255,215,0,0.25)" }}>{desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* VIDÉO - bientôt */}
        <p className="text-[10px] font-black tracking-[0.18em] mb-3 px-2"
          style={{ color: "rgba(255,215,0,0.35)" }}>♦ VIDÉO</p>
        <div className="px-3 py-3 rounded-xl"
          style={{ background: "rgba(255,215,0,0.03)", border: "1px dashed rgba(255,215,0,0.1)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-3 h-3" style={{ color: "rgba(255,215,0,0.25)" }} />
            <p className="text-xs font-black" style={{ color: "rgba(255,215,0,0.25)" }}>Bientôt</p>
          </div>
          <p className="text-[10px]" style={{ color: "rgba(255,215,0,0.15)" }}>En développement</p>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-black mb-1"
            style={{ background: "linear-gradient(135deg, #ffd700, #ff8c00)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {activeSection === "feed" ? "♦ Feed" : activeSection === "reels" ? "♠ Reels" : "♣ Script"}
          </h1>
          <p className="text-sm" style={{ color: "rgba(255,215,0,0.4)" }}>
            Sélectionne un skill pour générer ton contenu
          </p>
        </div>

        {visibleSkills.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4" style={{ filter: "drop-shadow(0 0 15px rgba(255,215,0,0.3))" }}>♠</p>
            <p className="text-sm font-bold" style={{ color: "rgba(255,215,0,0.2)" }}>Aucun skill disponible</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
            {visibleSkills.map((skill) => (
              <button key={skill.id} onClick={() => setSelectedSkill(skill)}
                className="group text-left p-6 rounded-2xl transition-all cursor-pointer"
                style={{ background: "#140e28", border: "1px solid rgba(255,215,0,0.12)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,215,0,0.35)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 0 25px rgba(255,215,0,0.07)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,215,0,0.12)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}>
                <div className="text-3xl mb-4" style={{ filter: "drop-shadow(0 0 8px rgba(255,215,0,0.3))" }}>
                  {skill.icon}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-black text-white">{skill.name}</h3>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                    style={CASINO_CAT_STYLES[skill.category] ?? {}}>
                    {skill.category}
                  </span>
                </div>
                <p className="text-xs leading-relaxed mb-4" style={{ color: "rgba(255,215,0,0.4)" }}>
                  {skill.description}
                </p>
                <span className="text-xs font-black" style={{ color: "#ffd700" }}>
                  Lancer → ♦
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
