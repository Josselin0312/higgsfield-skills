"use client";

import { useState, useRef } from "react";
import { Clock, Plus, Trash2, Zap, Loader2, Image as ImageIcon } from "lucide-react";

type GenSection = "feed" | "reels" | "script";

const SECTION_CONFIG = [
  { key: "feed" as GenSection, label: "Feed", icon: "♦", desc: "Posts & Captions" },
  { key: "reels" as GenSection, label: "Reels", icon: "♠", desc: "Hooks & Scripts" },
  { key: "script" as GenSection, label: "Script", icon: "♣", desc: "Scripts seuls" },
];

const RESOLUTIONS = [
  { label: "1:1 — 1024×1024", value: "1024x1024" },
  { label: "4:5 — 1080×1350", value: "1080x1350" },
  { label: "9:16 — 1080×1920", value: "1080x1920" },
  { label: "16:9 — 1920×1080", value: "1920x1080" },
  { label: "3:2 — 1200×800", value: "1200x800" },
  { label: "2:3 — 800×1200", value: "800x1200" },
];

const QUALITIES = ["Draft", "Standard", "High", "Ultra"];

const MODELS = [
  "Flux Pro 1.1",
  "Flux Dev",
  "Flux Schnell",
  "SDXL 1.0",
  "Playground v3",
];

const DEFAULT_RESOLUTION: Record<GenSection, string> = {
  feed: "1080x1350",
  reels: "1080x1920",
  script: "1080x1920",
};

interface GenRow {
  id: string;
  imageInput: string | null;
  imageReproduction: string | null;
  prompt: string;
  resolution: string;
  quality: string;
  model: string;
  count: number;
  status: "idle" | "loading" | "done";
}

function makeRow(section: GenSection): GenRow {
  return {
    id: `${Date.now()}-${Math.random()}`,
    imageInput: null,
    imageReproduction: null,
    prompt: "",
    resolution: DEFAULT_RESOLUTION[section],
    quality: "Standard",
    model: "Flux Pro 1.1",
    count: 1,
    status: "idle",
  };
}

const cellStyle: React.CSSProperties = {
  borderRight: "1px solid rgba(255,215,0,0.06)",
  padding: "8px",
  verticalAlign: "middle",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,215,0,0.03)",
  border: "1px solid rgba(255,215,0,0.14)",
  borderRadius: "8px",
  padding: "6px 10px",
  color: "white",
  fontSize: "12px",
  outline: "none",
};

const COLS = "80px 80px 1fr 152px 110px 150px 72px 90px 40px";

export default function GenerationPage() {
  const [activeSection, setActiveSection] = useState<GenSection>("feed");
  const [rowsBySection, setRowsBySection] = useState<Record<GenSection, GenRow[]>>({
    feed: [makeRow("feed")],
    reels: [makeRow("reels")],
    script: [makeRow("script")],
  });
  const [dragOver, setDragOver] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<{ id: string; field: "imageInput" | "imageReproduction" } | null>(null);

  const rows = rowsBySection[activeSection];

  const updateRow = (id: string, patch: Partial<GenRow>) => {
    setRowsBySection((prev) => ({
      ...prev,
      [activeSection]: prev[activeSection].map((r) => r.id === id ? { ...r, ...patch } : r),
    }));
  };

  const addRow = () => {
    setRowsBySection((prev) => ({
      ...prev,
      [activeSection]: [...prev[activeSection], makeRow(activeSection)],
    }));
  };

  const deleteRow = (id: string) => {
    setRowsBySection((prev) => ({
      ...prev,
      [activeSection]: prev[activeSection].filter((r) => r.id !== id),
    }));
  };

  const loadImage = (file: File, rowId: string, field: "imageInput" | "imageReproduction") => {
    const reader = new FileReader();
    reader.onload = (e) => updateRow(rowId, { [field]: e.target?.result as string });
    reader.readAsDataURL(file);
  };

  const handleGenerate = (id: string) => {
    updateRow(id, { status: "loading" });
    setTimeout(() => updateRow(id, { status: "done" }), 2000);
  };

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

      {/* Table area */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-black"
            style={{ background: "linear-gradient(135deg, #ffd700, #ff8c00)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {activeSection === "feed" ? "♦ Feed" : activeSection === "reels" ? "♠ Reels" : "♣ Script"}
          </h2>
          <button onClick={addRow}
            className="flex items-center gap-1.5 text-xs font-black px-3 py-2 rounded-xl"
            style={{ background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.18)", color: "rgba(255,215,0,0.7)" }}>
            <Plus className="w-3.5 h-3.5" /> Ajouter une ligne
          </button>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,215,0,0.12)", minWidth: "860px" }}>
          {/* Header */}
          <div style={{
            display: "grid", gridTemplateColumns: COLS,
            background: "#150d2a", borderBottom: "1px solid rgba(255,215,0,0.15)",
          }}>
            {["Image Input", "Reproduction", "Prompt de génération", "Résolution", "Qualité", "Modèle", "Nbr", "Output", ""].map((col, i) => (
              <div key={i} className="px-3 py-3 text-[10px] font-black tracking-widest uppercase"
                style={{ color: "rgba(255,215,0,0.5)", borderRight: i < 8 ? "1px solid rgba(255,215,0,0.08)" : "none" }}>
                {col}
              </div>
            ))}
          </div>

          {/* Rows */}
          {rows.map((row, idx) => (
            <div key={row.id}
              style={{
                display: "grid", gridTemplateColumns: COLS,
                borderBottom: idx < rows.length - 1 ? "1px solid rgba(255,215,0,0.06)" : "none",
                background: idx % 2 === 0 ? "#07050e" : "rgba(255,215,0,0.012)",
              }}>

              {/* Image Input */}
              <div style={cellStyle}>
                <div
                  onClick={() => { uploadTarget.current = { id: row.id, field: "imageInput" }; fileInputRef.current?.click(); }}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(`${row.id}-input`); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(null); const f = e.dataTransfer.files[0]; if (f?.type.startsWith("image/")) loadImage(f, row.id, "imageInput"); }}
                  className="w-14 h-14 rounded-lg flex items-center justify-center cursor-pointer overflow-hidden mx-auto transition-all"
                  style={{
                    border: dragOver === `${row.id}-input` ? "1px solid rgba(255,215,0,0.6)" : "1px dashed rgba(255,215,0,0.2)",
                    background: dragOver === `${row.id}-input` ? "rgba(255,215,0,0.08)" : "rgba(255,215,0,0.03)",
                  }}>
                  {row.imageInput
                    ? <img src={row.imageInput} alt="" className="w-full h-full object-cover" />
                    : <ImageIcon className="w-4 h-4" style={{ color: "rgba(255,215,0,0.25)" }} />}
                </div>
              </div>

              {/* Image Reproduction */}
              <div style={cellStyle}>
                <div
                  onClick={() => { uploadTarget.current = { id: row.id, field: "imageReproduction" }; fileInputRef.current?.click(); }}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(`${row.id}-repro`); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(null); const f = e.dataTransfer.files[0]; if (f?.type.startsWith("image/")) loadImage(f, row.id, "imageReproduction"); }}
                  className="w-14 h-14 rounded-lg flex items-center justify-center cursor-pointer overflow-hidden mx-auto transition-all"
                  style={{
                    border: dragOver === `${row.id}-repro` ? "1px solid rgba(255,45,120,0.6)" : "1px dashed rgba(255,45,120,0.2)",
                    background: dragOver === `${row.id}-repro` ? "rgba(255,45,120,0.08)" : "rgba(255,45,120,0.03)",
                  }}>
                  {row.imageReproduction
                    ? <img src={row.imageReproduction} alt="" className="w-full h-full object-cover" />
                    : <ImageIcon className="w-4 h-4" style={{ color: "rgba(255,45,120,0.25)" }} />}
                </div>
              </div>

              {/* Prompt */}
              <div style={{ ...cellStyle, padding: "8px" }}>
                <textarea value={row.prompt} onChange={(e) => updateRow(row.id, { prompt: e.target.value })}
                  placeholder="Décris l'image à générer..."
                  rows={2}
                  style={{ ...inputStyle, resize: "none", minHeight: "58px" }} />
              </div>

              {/* Resolution */}
              <div style={cellStyle}>
                <select value={row.resolution} onChange={(e) => updateRow(row.id, { resolution: e.target.value })}
                  style={inputStyle}>
                  {RESOLUTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>

              {/* Quality */}
              <div style={cellStyle}>
                <select value={row.quality} onChange={(e) => updateRow(row.id, { quality: e.target.value })}
                  style={inputStyle}>
                  {QUALITIES.map((q) => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>

              {/* Model */}
              <div style={cellStyle}>
                <select value={row.model} onChange={(e) => updateRow(row.id, { model: e.target.value })}
                  style={inputStyle}>
                  {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {/* Count */}
              <div style={cellStyle}>
                <input type="number" value={row.count} min={1}
                  onChange={(e) => updateRow(row.id, { count: Math.max(1, parseInt(e.target.value) || 1) })}
                  style={{ ...inputStyle, textAlign: "center", padding: "6px 4px" }} />
              </div>

              {/* Output */}
              <div style={{ ...cellStyle }}>
                <div className="w-14 h-14 rounded-lg flex items-center justify-center mx-auto overflow-hidden"
                  style={{ background: "#140e28", border: "1px solid rgba(255,215,0,0.1)" }}>
                  {row.status === "loading"
                    ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#ffd700" }} />
                    : row.status === "done"
                      ? <div className="w-full h-full flex items-center justify-center text-sm font-black text-white"
                          style={{ background: "linear-gradient(135deg, #7c00ff, #ff2d78)" }}>✓</div>
                      : <span style={{ color: "rgba(255,215,0,0.12)", fontSize: "18px" }}>—</span>}
                </div>
              </div>

              {/* Actions */}
              <div style={{ ...cellStyle, borderRight: "none" }} className="flex flex-col items-center justify-center gap-1.5">
                <button onClick={() => handleGenerate(row.id)} disabled={row.status === "loading"}
                  className="p-1.5 rounded-lg transition-all disabled:opacity-40"
                  style={{ background: "rgba(255,215,0,0.1)", color: "#ffd700" }} title="Générer">
                  <Zap className="w-3.5 h-3.5" />
                </button>
                {rows.length > 1 && (
                  <button onClick={() => deleteRow(row.id)}
                    className="p-1.5 rounded-lg hover:text-red-400 transition-colors"
                    style={{ color: "rgba(255,45,120,0.4)" }} title="Supprimer">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Add row */}
          <button onClick={addRow}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-colors"
            style={{ borderTop: "1px solid rgba(255,215,0,0.06)", background: "rgba(255,215,0,0.015)", color: "rgba(255,215,0,0.28)" }}>
            <Plus className="w-3.5 h-3.5" /> Ajouter une ligne
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f && uploadTarget.current) loadImage(f, uploadTarget.current.id, uploadTarget.current.field);
          e.target.value = "";
        }} />
    </div>
  );
}
