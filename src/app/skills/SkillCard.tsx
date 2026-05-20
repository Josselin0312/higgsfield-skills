"use client";

import { CATEGORY_LABELS, CATEGORY_COLORS, type Skill } from "@/lib/skills";
import { useSkills } from "@/lib/skillsStore";
import { ArrowRight, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

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
    <div className="group relative bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-600 transition-all hover:bg-zinc-800/60">
      {/* Admin controls */}
      {isAdmin && (
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-300 hover:text-white transition-colors"
            title="Modifier"
          >
            <Pencil className="w-3 h-3" />
          </button>
          {confirmDelete ? (
            <button
              onClick={(e) => { e.stopPropagation(); deleteSkill(skill.id); }}
              className="px-2 py-1 rounded-lg bg-red-500 text-white text-xs font-medium"
            >
              Confirmer
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000); }}
              className="p-1.5 rounded-lg bg-zinc-700 hover:bg-red-500/20 text-zinc-300 hover:text-red-400 transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      <button onClick={onSelect} className="w-full text-left">
        <div className="flex items-start justify-between mb-4">
          <span className="text-3xl">{skill.icon}</span>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${CATEGORY_COLORS[skill.category]}`}>
            {CATEGORY_LABELS[skill.category]}
          </span>
        </div>
        <h3 className="font-semibold text-white mb-1">{skill.name}</h3>
        <p className="text-sm text-zinc-400 leading-relaxed">{skill.description}</p>
        <div className="flex items-center gap-1.5 mt-4 text-sm text-zinc-500 group-hover:text-white transition-colors">
          <span>Lancer</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </button>
    </div>
  );
}
