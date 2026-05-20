"use client";

import { useState } from "react";
import { SKILLS, CATEGORY_LABELS, CATEGORY_COLORS, type SkillCategory } from "@/lib/skills";
import SkillCard from "./SkillCard";
import SkillRunner from "./SkillRunner";
import type { Skill } from "@/lib/skills";

const categories: (SkillCategory | "all")[] = ["all", "hook", "caption", "script", "visual", "dm"];

export default function SkillsPage() {
  const [activeCategory, setActiveCategory] = useState<SkillCategory | "all">("all");
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  const filtered = activeCategory === "all"
    ? SKILLS
    : SKILLS.filter((s) => s.category === activeCategory);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Skills IA</h1>
        <p className="text-zinc-400 mt-1">
          Des workflows pré-configurés pour automatiser la création de contenu Instagram
        </p>
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
            {cat === "all" ? "Tous" : CATEGORY_LABELS[cat]}
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
              onSelect={() => setSelectedSkill(skill)}
            />
          ))}
        </div>
      )}

      {/* Skill Runner */}
      {selectedSkill && (
        <SkillRunner
          skill={selectedSkill}
          onBack={() => setSelectedSkill(null)}
        />
      )}
    </div>
  );
}
