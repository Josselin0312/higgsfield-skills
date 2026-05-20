"use client";

import { useState } from "react";
import { Search, Trash2, Check, ArrowRight } from "lucide-react";
import { type Conversation } from "@/lib/crmData";
import { type CRMFilter } from "./page";
import { cn } from "@/lib/utils";

const FILTERS: { key: CRMFilter; label: string; icon: string }[] = [
  { key: "tous", label: "Tous", icon: "♠" },
  { key: "nouveau", label: "Nouveau", icon: "✦" },
  { key: "qualifie", label: "Qualifié", icon: "♛" },
  { key: "requests", label: "Requests", icon: "♦" },
];

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #ff2d78, #ff8c00)",
  "linear-gradient(135deg, #bf00ff, #ff2d78)",
  "linear-gradient(135deg, #00e5ff, #bf00ff)",
  "linear-gradient(135deg, #ffd700, #ff2d78)",
  "linear-gradient(135deg, #00ff88, #00e5ff)",
  "linear-gradient(135deg, #ff8c00, #ffd700)",
];

function avatarGradient(name: string) {
  const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}j`;
}

interface Props {
  convos: Conversation[];
  filter: CRMFilter;
  counts: Record<CRMFilter, number>;
  search: string;
  selectedId: string | null;
  onFilter: (f: CRMFilter) => void;
  onSearch: (s: string) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onAccept: (id: string) => void;
  onTransfer: (id: string, status: "new" | "qualified") => void;
}

export default function ConversationList({ convos, filter, counts, search, selectedId, onFilter, onSearch, onSelect, onDelete, onAccept, onTransfer }: Props) {
  const [transferMenu, setTransferMenu] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-5 pb-3" style={{ borderBottom: "1px solid rgba(255,215,0,0.1)" }}>
        <h1 className="text-xl font-black tracking-tight mb-3" style={{
          background: "linear-gradient(135deg, #ffd700, #ff8c00)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          ♠ Messages
        </h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "rgba(255,215,0,0.4)" }} />
          <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Rechercher..."
            className="w-full rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none transition-colors"
            style={{ background: "#100820", border: "1px solid rgba(255,215,0,0.15)" }} />
        </div>
      </div>

      {/* Filters — 2×2 grid so all 4 are always visible */}
      <div className="grid grid-cols-2 gap-1.5 px-3 py-3" style={{ borderBottom: "1px solid rgba(255,215,0,0.08)" }}>
        {FILTERS.map(({ key, label, icon }) => (
          <button key={key} onClick={() => onFilter(key)}
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all"
            style={filter === key ? {
              background: "linear-gradient(135deg, #ffd700, #ff8c00)",
              color: "#0a0510",
              boxShadow: "0 0 12px rgba(255,215,0,0.4)",
            } : {
              background: "rgba(255,215,0,0.04)",
              border: "1px solid rgba(255,215,0,0.12)",
              color: "rgba(255,215,0,0.5)",
            }}>
            <span>{icon} {label}</span>
            <span className="rounded-full px-1.5 text-[9px] font-black"
              style={filter === key ? { background: "rgba(0,0,0,0.2)" } : { background: "rgba(255,215,0,0.1)" }}>
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {convos.length === 0 && (
          <div className="text-center py-12 text-xs font-bold" style={{ color: "rgba(255,215,0,0.2)" }}>
            ♦ Aucune conversation ♦
          </div>
        )}
        {convos.map((c) => (
          <div key={c.id} onClick={() => onSelect(c.id)}
            className="group relative flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all"
            style={{
              background: selectedId === c.id ? "rgba(124,0,255,0.12)" : undefined,
              borderLeft: selectedId === c.id ? "2px solid #ff2d78" : "2px solid transparent",
              borderBottom: "1px solid rgba(255,215,0,0.05)",
            }}>

            {/* Avatar with neon ring */}
            <div className="relative flex-shrink-0">
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-black text-white"
                style={{
                  background: avatarGradient(c.fullName),
                  border: "2px solid rgba(255,215,0,0.25)",
                  boxShadow: selectedId === c.id ? "0 0 12px rgba(255,45,120,0.5)" : undefined,
                }}>
                {c.fullName[0]}
              </div>
              {c.unread > 0 && (
                <div className="absolute -top-1 -right-1 rounded-full flex items-center justify-center text-[9px] font-black text-white px-1"
                  style={{ background: "linear-gradient(135deg, #ff2d78, #ff8c00)", boxShadow: "0 0 8px rgba(255,45,120,0.7)", minWidth: "18px", height: "18px" }}>
                  {c.unread}
                </div>
              )}
              {c.isRequest && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white"
                  style={{ background: "#bf00ff" }}>?</div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className={cn("text-sm truncate", c.unread > 0 ? "font-black text-white" : "font-semibold text-zinc-300")}>
                  {c.fullName}
                </span>
                <span className="text-[10px] ml-2 flex-shrink-0" style={{ color: "rgba(255,215,0,0.35)" }}>{timeAgo(c.lastTs)}</span>
              </div>
              <p className={cn("text-xs truncate", c.unread > 0 ? "text-zinc-400" : "text-zinc-600")}>
                {c.lastMessage}
              </p>
              {c.status === "qualified" && (
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full mt-1 inline-block"
                  style={{ background: "rgba(255,215,0,0.1)", color: "#ffd700", border: "1px solid rgba(255,215,0,0.25)" }}>
                  ♛ Qualifié
                </span>
              )}
            </div>

            {/* Hover actions */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 rounded-xl p-1 z-10"
              style={{ background: "#150d2a", border: "1px solid rgba(255,215,0,0.2)" }}>
              {c.isRequest && (
                <button onClick={(e) => { e.stopPropagation(); onAccept(c.id); }}
                  className="p-1.5 rounded-lg transition-colors" style={{ color: "#00ff88" }} title="Accepter">
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}
              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setTransferMenu(transferMenu === c.id ? null : c.id); }}
                  className="p-1.5 rounded-lg transition-colors" style={{ color: "rgba(255,215,0,0.7)" }} title="Transférer">
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                {transferMenu === c.id && (
                  <div className="absolute right-0 top-full mt-1 rounded-xl overflow-hidden shadow-2xl z-20 w-36"
                    style={{ background: "#150d2a", border: "1px solid rgba(255,215,0,0.3)" }}>
                    <button onClick={(e) => { e.stopPropagation(); onTransfer(c.id, "new"); setTransferMenu(null); }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-white/5 transition-colors"
                      style={{ color: "rgba(255,215,0,0.8)" }}>✦ Nouveau</button>
                    <button onClick={(e) => { e.stopPropagation(); onTransfer(c.id, "qualified"); setTransferMenu(null); }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-white/5 transition-colors"
                      style={{ color: "#ffd700" }}>♛ Qualifier</button>
                  </div>
                )}
              </div>
              <button onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                className="p-1.5 rounded-lg transition-colors hover:text-red-400"
                style={{ color: "rgba(255,45,120,0.6)" }}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
