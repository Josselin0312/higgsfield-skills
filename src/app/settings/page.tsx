"use client";

import { useState } from "react";
import { Camera, Key, Users, Save, CheckCircle, Plus } from "lucide-react";

const setters = [
  { id: "1", name: "Sophie", role: "setter", gradient: "linear-gradient(135deg, #ff2d78, #ff8c00)" },
  { id: "2", name: "Lucas", role: "closer", gradient: "linear-gradient(135deg, #7c00ff, #bf00ff)" },
];

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#150d2a", border: "1px solid rgba(255,215,0,0.18)",
  borderRadius: "12px", padding: "10px 14px", color: "white", fontSize: "14px", outline: "none",
};

const cardStyle: React.CSSProperties = {
  background: "#140e28", border: "1px solid rgba(255,215,0,0.12)", borderRadius: "16px", padding: "24px",
};

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-8 max-w-2xl h-full overflow-y-auto" style={{ background: "#07050e" }}>
      <div className="mb-8">
        <h1 className="text-2xl font-black mb-1"
          style={{ background: "linear-gradient(135deg, #ffd700, #ff8c00)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          ♦ Paramètres
        </h1>
        <p className="text-sm" style={{ color: "rgba(255,215,0,0.4)" }}>Configure ta plateforme SlideIn</p>
      </div>

      <div className="space-y-5">
        {/* Instagram */}
        <div style={cardStyle}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #ff2d78, #ff8c00)" }}>
              <Camera className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-black text-white">Compte Instagram</h2>
          </div>
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-[10px] font-black tracking-widest mb-1.5 uppercase" style={{ color: "rgba(255,215,0,0.45)" }}>
                Token d&apos;accès Instagram
              </label>
              <input type="password" placeholder="IGQV..." style={inputStyle} />
              <p className="text-xs mt-1.5" style={{ color: "rgba(255,215,0,0.3)" }}>
                Obtenir via Meta for Developers → Graph API Explorer
              </p>
            </div>
            <div>
              <label className="block text-[10px] font-black tracking-widest mb-1.5 uppercase" style={{ color: "rgba(255,215,0,0.45)" }}>
                ID du compte Instagram
              </label>
              <input type="text" placeholder="17841400..." style={inputStyle} />
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl text-xs font-bold"
            style={{ background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.2)", color: "#ffd700" }}>
            <span>⚠</span>
            <span>Nécessite un compte Instagram Business connecté à une Page Facebook</span>
          </div>
        </div>

        {/* API Key */}
        <div style={cardStyle}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #7c00ff, #bf00ff)" }}>
              <Key className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-black text-white">Clé API IA (Claude)</h2>
          </div>
          <div>
            <label className="block text-[10px] font-black tracking-widest mb-1.5 uppercase" style={{ color: "rgba(255,215,0,0.45)" }}>
              Anthropic API Key
            </label>
            <input type="password" placeholder="sk-ant-..." style={inputStyle} />
            <p className="text-xs mt-1.5" style={{ color: "rgba(255,215,0,0.3)" }}>
              Variable d&apos;env : <code className="px-1.5 py-0.5 rounded font-mono" style={{ background: "#1a0d30", color: "#00e5ff" }}>ANTHROPIC_API_KEY</code> dans <code className="px-1.5 py-0.5 rounded font-mono" style={{ background: "#1a0d30", color: "#00e5ff" }}>.env.local</code>
            </p>
          </div>
        </div>

        {/* Team */}
        <div style={cardStyle}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #00e5ff, #7c00ff)" }}>
                <Users className="w-4 h-4 text-white" />
              </div>
              <h2 className="font-black text-white">Équipe</h2>
            </div>
            <button className="flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-xl transition-colors"
              style={{ border: "1px solid rgba(255,215,0,0.2)", color: "rgba(255,215,0,0.6)" }}>
              <Plus className="w-3 h-3" /> Ajouter
            </button>
          </div>
          <div className="space-y-2">
            {setters.map((setter) => (
              <div key={setter.id} className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ background: "#1a0d30", border: "1px solid rgba(255,215,0,0.08)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white"
                    style={{ background: setter.gradient }}>
                    {setter.name[0]}
                  </div>
                  <span className="text-sm font-bold text-white">{setter.name}</span>
                </div>
                <span className="text-xs font-black px-2.5 py-1 rounded-full"
                  style={setter.role === "closer"
                    ? { background: "rgba(191,0,255,0.12)", color: "#bf80ff", border: "1px solid rgba(191,0,255,0.3)" }
                    : { background: "rgba(0,229,255,0.1)", color: "#00e5ff", border: "1px solid rgba(0,229,255,0.25)" }}>
                  {setter.role === "closer" ? "Closer" : "Setter"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Save */}
        <button onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 font-black py-3 rounded-xl transition-all"
          style={saved ? {
            background: "linear-gradient(135deg, #00ff88, #00e5ff)",
            color: "#07050e",
            boxShadow: "0 0 20px rgba(0,255,136,0.35)",
          } : {
            background: "linear-gradient(135deg, #ffd700, #ff8c00)",
            color: "#0a0510",
            boxShadow: "0 0 20px rgba(255,215,0,0.35)",
          }}>
          {saved ? (
            <><CheckCircle className="w-4 h-4" /> Sauvegardé !</>
          ) : (
            <><Save className="w-4 h-4" /> Sauvegarder ♦</>
          )}
        </button>
      </div>
    </div>
  );
}
