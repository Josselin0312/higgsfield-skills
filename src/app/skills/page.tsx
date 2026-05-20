"use client";

import { useState } from "react";
import { CATEGORY_LABELS, type SkillCategory } from "@/lib/skills";
import { useSkills } from "@/lib/skillsStore";
import { useRole } from "@/lib/role";
import SkillCard from "./SkillCard";
import SkillRunner from "./SkillRunner";
import SkillEditor from "./SkillEditor";
import type { Skill } from "@/lib/skills";
import { Plus, Lock } from "lucide-react";

const categories: (SkillCategory | "all")[] = ["all", "hook", "caption", "script", "visual", "dm"];

export default function SkillsPage() {
  const { skills } = useSkills();
  const { isAdmin } = useRole();
  const [activeCategory, setActiveCategory] = useState<SkillCategory | "all">("all");
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [editingSkill, setEditingSkill] = useState<Skill | "new" | null>(null);

  const filtered = activeCategory === "all"
    ? skills
    : skills.filter((s) => s.category === activeCategory);

  if (editingSkill !== null) {
    return (
      <SkillEditor
        skill={editingSkill === "new" ? null : editingSkill}
        onBack={() => setEditingSkill(null)}
      />
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Skills IA</h1>
          <p className="text-zinc-400 mt-1">
            Workflows pré-configurés pour automatiser la création de contenu
          </p>
        </div>
        {isAdmin ? (
          <button
            onClick={() => setEditingSkill("new")}
            className="flex items-center gap-2 bg-white text-black font-semibold px-4 py-2.5 rounded-xl hover:bg-zinc-200 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Nouveau Skill
          </button>
        ) : (
          <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg">
            <Lock className="w-3 h-3" />
            Géré par l&apos;admin
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
              activeCategory === cat
                ? "bg-white text-black border-white"
                : "bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-white"
            }`}
          >
            {cat === "all" ? `Tous (${skills.length})` : CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Skills Grid */}
      {!selectedSkill && (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              isAdmin={isAdmin}
              onSelect={() => setSelectedSkill(skill)}
              onEdit={() => setEditingSkill(skill)}
            />
          ))}
        </div>
      )}

      {selectedSkill && (
        <SkillRunner skill={selectedSkill} onBack={() => setSelectedSkill(null)} />
      )}
    </div>
  );
}
