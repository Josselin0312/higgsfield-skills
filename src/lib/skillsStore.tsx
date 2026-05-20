"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { SKILLS, type Skill } from "./skills";

interface SkillsContextType {
  skills: Skill[];
  addSkill: (s: Skill) => void;
  updateSkill: (s: Skill) => void;
  deleteSkill: (id: string) => void;
}

const SkillsContext = createContext<SkillsContextType | null>(null);

export function SkillsProvider({ children }: { children: ReactNode }) {
  const [skills, setSkills] = useState<Skill[]>(SKILLS);

  const addSkill = (s: Skill) => setSkills((prev) => [...prev, s]);
  const updateSkill = (s: Skill) => setSkills((prev) => prev.map((x) => (x.id === s.id ? s : x)));
  const deleteSkill = (id: string) => setSkills((prev) => prev.filter((x) => x.id !== id));

  return (
    <SkillsContext.Provider value={{ skills, addSkill, updateSkill, deleteSkill }}>
      {children}
    </SkillsContext.Provider>
  );
}

export function useSkills() {
  const ctx = useContext(SkillsContext);
  if (!ctx) throw new Error("useSkills must be used within SkillsProvider");
  return ctx;
}
