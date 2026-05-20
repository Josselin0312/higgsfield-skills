"use client";

import { CATEGORY_LABELS, CATEGORY_COLORS, type Skill } from "@/lib/skills";
import { ArrowRight } from "lucide-react";

interface Props {
  skill: Skill;
  onSelect: () => void;
}

export default function SkillCard({ skill, onSelect }: Props) {
  return (
    <button
      onClick={onSelect}
      className="group text-left bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-600 transition-all hover:bg-zinc-800/60"
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-3xl">{skill.icon}</span>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
            CATEGORY_COLORS[skill.category]
          }`}
        >
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
  );
}
