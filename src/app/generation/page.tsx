"use client";

import { useState, useRef } from "react";
import { Clock, Plus, Trash2, Loader2, Image as ImageIcon, X, Play, Sparkles } from "lucide-react";

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

const QUALITIES = ["1K", "2K", "4K"];
const MODELS = ["NanobananaPRO"];

const DEFAULT_RESOLUTION: Record<GenSection, string> = {
  feed: "1080x1350",
  reels: "1080x1920",
  script: "1080x1920",
};

interface GenRow {
  id: string;
  imageInput: string[];
  imageReproduction: string[];
  prompt: string;
  resolution: string;
  quality: string;
  model: string;
  count: number;
  status: "idle" | "loading" | "done" | "error";
  outputImages: string[];
  errorMsg?: string;
}

let rowCounter = 0;
function makeRow(section: GenSection): GenRow {
  return {
    id: `row-${++rowCounter}-${Math.random().toString(36).slice(2)}`,
    imageInput: [],
    imageReproduction: [],
    prompt: "",
    resolution: DEFAULT_RESOLUTION[section],
    quality: "1K",
    model: "NanobananaPRO",
    count: 1,
    status: "idle",
    outputImages: [],
  };
}

function make10(section: GenSection): GenRow[] {
  return Array.from({ length: 10 }, () => makeRow(section));
}

const cellStyle: React.CSSProperties = {
  borderRight: "1px solid rgba(255,215,0,0.06)",
  padding: "8px 6px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-start",
  alignItems: "stretch",
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

const COLS = "96px 96px minmax(280px,1fr) 148px 82px 136px 66px 110px 96px 36px";

interface ImageStackProps {
  images: string[];
  accent: string;
  dragKey: string;
  dragOver: string | null;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
}

function ImageStack({ images, accent, dragKey, dragOver, onDragOver, onDragLeave, onDrop, onAdd, onRemove }: ImageStackProps) {
  const isOver = dragOver === dragKey;
  return (
    <div className="flex flex-col gap-1 items-center"
      onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      {images.map((src, i) => (
        <div key={i} className="relative group/thumb flex-shrink-0"
          style={{ width: "56px", height: "56px" }}>
          <img src={src} alt="" className="w-full h-full rounded-lg object-cover" />
          <button
            onClick={() => onRemove(i)}
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity"
            style={{ background: "#ff2d78", color: "white" }}>
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      ))}
      <button
        onClick={onAdd}
        className="flex-shrink-0 rounded-lg flex items-center justify-center cursor-pointer transition-all"
        style={{
          width: "56px", height: "56px",
          border: isOver ? `1px solid ${accent}` : `1px dashed ${accent}44`,
          background: isOver ? `${accent}14` : `${accent}06`,
        }}>
        {images.length === 0
          ? <ImageIcon className="w-4 h-4" style={{ color: `${accent}44` }} />
          : <Plus className="w-3.5 h-3.5" style={{ color: `${accent}66` }} />}
      </button>
    </div>
  );
}

export default function GenerationPage() {
  const [activeSection, setActiveSection] = useState<GenSection>("feed");
  const [rowsBySection, setRowsBySection] = useState<Record<GenSection, GenRow[]>>({
    feed: make10("feed"),
    reels: make10("reels"),
    script: make10("script"),
  });
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState<Record<string, boolean>>({});
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

  const appendImages = (files: File[], rowId: string, field: "imageInput" | "imageReproduction") => {
    files.forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setRowsBySection((prev) => ({
          ...prev,
          [activeSection]: prev[activeSection].map((r) =>
            r.id === rowId ? { ...r, [field]: [...r[field], result] } : r
          ),
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (rowId: string, field: "imageInput" | "imageReproduction", index: number) => {
    setRowsBySection((prev) => ({
      ...prev,
      [activeSection]: prev[activeSection].map((r) =>
        r.id === rowId ? { ...r, [field]: r[field].filter((_, i) => i !== index) } : r
      ),
    }));
  };

  const handleAnalyzeGoal = async (id: string) => {
    const row = rowsBySection[activeSection].find((r) => r.id === id);
    if (!row || !row.imageReproduction[0]) return;
    setAnalyzing((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch("/api/analyze-goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalImage: row.imageReproduction[0] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur analyse");
      updateRow(id, { prompt: data.prompt });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de l'analyse");
    } finally {
      setAnalyzing((prev) => ({ ...prev, [id]: false }));
    }
  };

  const uploadFromBrowser = async (base64: string): Promise<{ id: string; url: string }> => {
    const [header, data] = base64.split(",");
    const contentType = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";

    const urlRes = await fetch("/api/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content_type: contentType }),
    });
    if (!urlRes.ok) throw new Error("Erreur obtention URL upload");
    const { upload_url, public_url } = await urlRes.json();

    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const putRes = await fetch(upload_url, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: bytes,
    });
    if (!putRes.ok) throw new Error(`Upload S3 échoué: ${putRes.status}`);

    const id = public_url.split("/").pop()?.replace(/\.[^.]+$/, "") ?? crypto.randomUUID();
    return { id, url: public_url };
  };

  const handleGenerate = async (id: string) => {
    const row = rowsBySection[activeSection].find((r) => r.id === id);
    if (!row || row.status === "loading") return;
    updateRow(id, { status: "loading", outputImages: [], errorMsg: undefined });
    try {
      const refImages = row.imageInput.length > 0 ? row.imageInput : row.imageReproduction;

      const uploaded = await Promise.all(
        refImages.map((img) => img.startsWith("data:") ? uploadFromBrowser(img) : Promise.resolve({ id: img, url: img }))
      );
      const inputImages = uploaded.map(({ id, url }) => ({ id, type: "media_input", url }));

      const res = await fetch("/api/image-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: row.prompt,
          resolution: row.resolution,
          quality: row.quality,
          count: row.count,
          inputImages,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur API");
      updateRow(id, { status: "done", outputImages: data.images ?? [] });
    } catch (err) {
      updateRow(id, { status: "error", errorMsg: err instanceof Error ? err.message : "Erreur" });
    }
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

        <div className="overflow-x-auto rounded-2xl" style={{ border: "1px solid rgba(255,215,0,0.12)" }}>
        <div style={{ minWidth: "1100px" }}>
          {/* Header */}
          <div style={{
            display: "grid", gridTemplateColumns: COLS,
            background: "#150d2a", borderBottom: "1px solid rgba(255,215,0,0.15)",
          }}>
            {["Image Input", "Goal", "Prompt de génération", "Résolution", "Qualité", "Modèle", "Nbr", "Start", "Output", ""].map((col, i) => (
              <div key={i} className="px-3 py-3 text-[10px] font-black tracking-widest uppercase"
                style={{ color: i === 7 ? "#ffd700" : "rgba(255,215,0,0.5)", borderRight: i < 9 ? "1px solid rgba(255,215,0,0.08)" : "none" }}>
                {col}
              </div>
            ))}
          </div>

          {/* Rows */}
          {rows.map((row, idx) => (
            <div key={row.id}
              style={{
                display: "grid", gridTemplateColumns: COLS, alignItems: "stretch",
                borderBottom: idx < rows.length - 1 ? "1px solid rgba(255,215,0,0.06)" : "none",
                background: idx % 2 === 0 ? "#07050e" : "rgba(255,215,0,0.012)",
              }}>

              {/* Image Input */}
              <div style={{ ...cellStyle, padding: "8px 4px", alignItems: "center" }}>
                <ImageStack
                  images={row.imageInput}
                  accent="#ffd700"
                  dragKey={`${row.id}-input`}
                  dragOver={dragOver}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(`${row.id}-input`); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(null); appendImages(Array.from(e.dataTransfer.files), row.id, "imageInput"); }}
                  onAdd={() => { uploadTarget.current = { id: row.id, field: "imageInput" }; fileInputRef.current?.click(); }}
                  onRemove={(i) => removeImage(row.id, "imageInput", i)}
                />
              </div>

              {/* Goal */}
              <div style={{ ...cellStyle, padding: "8px 4px", alignItems: "center" }}>
                <ImageStack
                  images={row.imageReproduction}
                  accent="#ff2d78"
                  dragKey={`${row.id}-repro`}
                  dragOver={dragOver}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(`${row.id}-repro`); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(null); appendImages(Array.from(e.dataTransfer.files), row.id, "imageReproduction"); }}
                  onAdd={() => { uploadTarget.current = { id: row.id, field: "imageReproduction" }; fileInputRef.current?.click(); }}
                  onRemove={(i) => removeImage(row.id, "imageReproduction", i)}
                />
              </div>

              {/* Prompt */}
              <div style={{ ...cellStyle, padding: "6px 8px" }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-black tracking-widest uppercase" style={{ color: "rgba(255,215,0,0.3)" }}>Prompt</span>
                  <button
                    onClick={() => handleAnalyzeGoal(row.id)}
                    disabled={!row.imageReproduction[0] || analyzing[row.id]}
                    title={row.imageReproduction[0] ? "Analyser l'image Goal et générer le prompt" : "Ajoute d'abord une image dans Goal"}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.2)", color: "#ffd700" }}>
                    {analyzing[row.id]
                      ? <><Loader2 className="w-2.5 h-2.5 animate-spin" /> Analyse...</>
                      : <><Sparkles className="w-2.5 h-2.5" /> Auto</>}
                  </button>
                </div>
                <textarea
                  value={row.prompt}
                  onChange={(e) => updateRow(row.id, { prompt: e.target.value })}
                  placeholder="Ajoute une image Goal puis clique ✨ Auto pour générer le prompt, ou écris-le manuellement..."
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical", minHeight: "90px", fontSize: "11px", lineHeight: "1.5" }} />
              </div>

              {/* Resolution */}
              <div style={{ ...cellStyle, padding: "8px 6px" }}>
                <select value={row.resolution} onChange={(e) => updateRow(row.id, { resolution: e.target.value })}
                  style={{ ...inputStyle, fontSize: "11px" }}>
                  {RESOLUTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>

              {/* Quality */}
              <div style={{ ...cellStyle, padding: "8px 6px" }}>
                <select value={row.quality} onChange={(e) => updateRow(row.id, { quality: e.target.value })}
                  style={{ ...inputStyle, fontSize: "11px" }}>
                  {QUALITIES.map((q) => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>

              {/* Model */}
              <div style={{ ...cellStyle, padding: "8px 6px" }}>
                <select value={row.model} onChange={(e) => updateRow(row.id, { model: e.target.value })}
                  style={{ ...inputStyle, fontSize: "11px" }}>
                  {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {/* Count */}
              <div style={{ ...cellStyle, padding: "8px 6px" }}>
                <select value={row.count} onChange={(e) => updateRow(row.id, { count: parseInt(e.target.value) })}
                  style={{ ...inputStyle, fontSize: "11px", textAlign: "center", padding: "6px 4px" }}>
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              {/* Start */}
              <div style={{ ...cellStyle, padding: "8px", alignItems: "center", justifyContent: "center" }}>
                <button
                  onClick={() => handleGenerate(row.id)}
                  disabled={row.status === "loading"}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-black text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={row.status === "loading" ? {
                    background: "rgba(255,215,0,0.05)",
                    border: "1px solid rgba(255,215,0,0.2)",
                    color: "rgba(255,215,0,0.4)",
                  } : {
                    background: "linear-gradient(135deg, #ffd700, #ff8c00)",
                    color: "#07050e",
                    boxShadow: "0 0 14px rgba(255,215,0,0.25)",
                  }}>
                  {row.status === "loading"
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> En cours</>
                    : <><Play className="w-3.5 h-3.5" fill="currentColor" /> Start</>}
                </button>
              </div>

              {/* Output */}
              <div style={{ ...cellStyle, padding: "8px 4px", alignItems: "center" }}>
                <div className="flex flex-col gap-1 items-center w-full">
                  {row.status === "loading" && (
                    <div className="w-14 h-14 rounded-lg flex items-center justify-center"
                      style={{ background: "#140e28", border: "1px solid rgba(255,215,0,0.1)" }}>
                      <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#ffd700" }} />
                    </div>
                  )}
                  {row.status === "error" && (
                    <div className="rounded-lg p-2 text-center"
                      style={{ background: "rgba(255,45,120,0.08)", border: "1px solid rgba(255,45,120,0.2)", color: "#ff2d78", fontSize: "10px", lineHeight: "1.4", maxWidth: "88px" }}>
                      ✕ {row.errorMsg ?? "Erreur"}
                    </div>
                  )}
                  {row.status === "done" && row.outputImages.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer"
                      className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 block">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </a>
                  ))}
                  {row.status === "done" && row.outputImages.length === 0 && (
                    <div className="w-14 h-14 rounded-lg flex items-center justify-center text-xs font-black"
                      style={{ background: "rgba(255,215,0,0.06)", color: "rgba(255,215,0,0.4)" }}>?</div>
                  )}
                  {row.status === "idle" && (
                    <div className="w-14 h-14 rounded-lg flex items-center justify-center"
                      style={{ background: "#140e28", border: "1px solid rgba(255,215,0,0.08)" }}>
                      <span style={{ color: "rgba(255,215,0,0.12)", fontSize: "18px" }}>—</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Delete */}
              <div style={{ ...cellStyle, borderRight: "none", alignItems: "center", justifyContent: "center" }}>
                {rows.length > 1 && (
                  <button onClick={() => deleteRow(row.id)}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: "rgba(255,45,120,0.35)" }} title="Supprimer">
                    <Trash2 className="w-3.5 h-3.5" />
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
      </div>

      {/* Hidden file input — multiple files allowed */}
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length && uploadTarget.current) {
            appendImages(files, uploadTarget.current.id, uploadTarget.current.field);
          }
          e.target.value = "";
        }} />
    </div>
  );
}
