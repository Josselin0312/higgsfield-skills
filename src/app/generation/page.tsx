"use client";

import { useState } from "react";
import { Clock } from "lucide-react";

type GenSection = "feed" | "reels" | "script";

const SECTION_CONFIG = [
  { key: "feed" as GenSection, label: "Feed", icon: "♦", desc: "Posts & Captions" },
  { key: "reels" as GenSection, label: "Reels", icon: "♠", desc: "Hooks & Scripts" },
  { key: "script" as GenSection, label: "Script", icon: "♣", desc: "Scripts seuls" },
];

export default function GenerationPage() {
  const [activeSection, setActiveSection] = useState<GenSection>("feed");

  return (
    <div className="flex h-full overflow-hidden" style={{ background: "#07050e" }}>
      {/* Sub-nav */}
      <div className="w-52 flex-shrink-0 py-5 px-3"
        style={{ background: "#0a0618", borderRight: "1px solid rgba(255,215,0,0.1)" }}>

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

      {/* Main — empty for now */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <p className="text-5xl" style={{ filter: "drop-shadow(0 0 20px rgba(255,215,0,0.3))" }}>
          {activeSection === "feed" ? "♦" : activeSection === "reels" ? "♠" : "♣"}
        </p>
        <p className="text-sm font-black" style={{ color: "rgba(255,215,0,0.25)" }}>
          {activeSection === "feed" ? "Feed" : activeSection === "reels" ? "Reels" : "Script"}
        </p>
      </div>
    </div>
  );
}
