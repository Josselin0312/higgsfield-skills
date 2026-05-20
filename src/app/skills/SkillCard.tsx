"use client";

import { type Skill } from "@/lib/skills";
import { useSkills } from "@/lib/skillsStore";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

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

interface Props {
  skill: Skill;
  isAdmin: boolean;
  onSelect: () => void;
  onEdit: () => void;
}

export default function SkillCard({ skill, isAdmin, onSelect, onEdit }: Props) {
  const { deleteSkill } = useSkills();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="group relative p-6 rounded-2xl transition-all cursor-pointer"
      style={{ background: "#140e28", border: "1px solid rgba(255,215,0,0.12)" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,215,0,0.3)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 0 25px rgba(255,215,0,0.07)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,215,0,0.12)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}>

      {/* Admin controls */}
      {isAdmin && (
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-1.5 rounded-lg transition-colors"
            style={{ background: "rgba(255,215,0,0.1)", color: "rgba(255,215,0,0.7)" }}>
            <Pencil className="w-3 h-3" />
          </button>
          {confirmDelete ? (
            <button onClick={(e) => { e.stopPropagation(); deleteSkill(skill.id); }}
              className="px-2 py-1 rounded-lg text-xs font-black text-black"
              style={{ background: "linear-gradient(135deg, #ff2d78, #ff8c00)" }}>
              Confirmer
            </button>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000); }}
              className="p-1.5 rounded-lg transition-colors hover:text-red-400"
              style={{ background: "rgba(255,45,120,0.1)", color: "rgba(255,45,120,0.7)" }}>
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      <button onClick={onSelect} className="w-full text-left">
        <div className="flex items-start justify-between mb-4">
          <span className="text-3xl" style={{ filter: "drop-shadow(0 0 8px rgba(255,215,0,0.3))" }}>
            {skill.icon}
          </span>
          <span className="text-[10px] font-black px-2.5 py-1 rounded-full"
            style={CAT_STYLES[skill.category] ?? {}}>
            {CAT_LABELS[skill.category] ?? skill.category}
          </span>
        </div>
        <h3 className="font-black text-white mb-1">{skill.name}</h3>
        <p className="text-xs leading-relaxed mb-4" style={{ color: "rgba(255,215,0,0.4)" }}>
          {skill.description}
        </p>
        <span className="text-xs font-black" style={{ color: "#ffd700" }}>
          Lancer ♦ →
        </span>
      </button>
    </div>
  );
}
