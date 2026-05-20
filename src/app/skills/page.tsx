"use client";

import { useState } from "react";
import { type SkillCategory } from "@/lib/skills";
import { useSkills } from "@/lib/skillsStore";
import { useRole } from "@/lib/role";
import SkillCard from "./SkillCard";
import SkillRunner from "./SkillRunner";
import SkillEditor from "./SkillEditor";
import type { Skill } from "@/lib/skills";
import { Plus, Lock } from "lucide-react";

const CATEGORY_LABELS: Record<SkillCategory | "all", string> = {
  all: "Tous",
  hook: "Hooks",
  caption: "Captions",
  script: "Scripts",
  visual: "Visuels",
  dm: "DM",
};

const categories: (SkillCategory | "all")[] = ["all", "hook", "caption", "script", "visual", "dm"];

export default function SkillsPage() {
  const { skills } = useSkills();
  const { isAdmin } = useRole();
  const [activeCategory, setActiveCategory] = useState<SkillCategory | "all">("all");
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [editingSkill, setEditingSkill] = useState<Skill | "new" | null>(null);

  const filtered = activeCategory === "all" ? skills : skills.filter((s) => s.category === activeCategory);

  if (editingSkill !== null) {
    return <SkillEditor skill={editingSkill === "new" ? null : editingSkill} onBack={() => setEditingSkill(null)} />;
  }

  return (
    <div className="p-8 h-full overflow-y-auto" style={{ background: "#07050e" }}>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black mb-1"
            style={{ background: "linear-gradient(135deg, #ffd700, #ff8c00)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            ⚡ Skills IA
          </h1>
          <p className="text-sm" style={{ color: "rgba(255,215,0,0.4)" }}>
            Workflows pré-configurés pour automatiser la création de contenu
          </p>
        </div>
        {isAdmin ? (
          <button onClick={() => setEditingSkill("new")}
            className="flex items-center gap-2 text-sm font-black px-4 py-2.5 rounded-xl transition-all text-black"
            style={{ background: "linear-gradient(135deg, #ffd700, #ff8c00)", boxShadow: "0 0 15px rgba(255,215,0,0.3)" }}>
            <Plus className="w-4 h-4" /> Nouveau Skill
          </button>
        ) : (
          <div className="flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg"
            style={{ background: "rgba(255,215,0,0.05)", border: "1px solid rgba(255,215,0,0.15)", color: "rgba(255,215,0,0.4)" }}>
            <Lock className="w-3 h-3" /> Géré par l&apos;admin
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className="px-4 py-1.5 rounded-full text-xs font-black transition-all"
            style={activeCategory === cat ? {
              background: "linear-gradient(135deg, #ffd700, #ff8c00)",
              color: "#0a0510",
              boxShadow: "0 0 12px rgba(255,215,0,0.3)",
            } : {
              background: "rgba(255,215,0,0.04)",
              border: "1px solid rgba(255,215,0,0.15)",
              color: "rgba(255,215,0,0.5)",
            }}>
            {cat === "all" ? `${CATEGORY_LABELS.all} (${skills.length})` : CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {!selectedSkill && (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((skill) => (
            <SkillCard key={skill.id} skill={skill} isAdmin={isAdmin}
              onSelect={() => setSelectedSkill(skill)}
              onEdit={() => setEditingSkill(skill)} />
          ))}
        </div>
      )}

      {selectedSkill && (
        <SkillRunner skill={selectedSkill} onBack={() => setSelectedSkill(null)} />
      )}
    </div>
  );
}
