"use client";

import { Search, Trash2, Check } from "lucide-react";
import { type Conversation } from "@/lib/crmData";
import { type CRMFilter } from "./page";
import { cn } from "@/lib/utils";

const FILTERS: { key: CRMFilter; label: string }[] = [
  { key: "tous", label: "Tous" },
  { key: "nouveau", label: "Nouveau" },
  { key: "qualifie", label: "Qualifié" },
  { key: "requests", label: "Requests" },
];

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
}

export default function ConversationList({ convos, filter, counts, search, selectedId, onFilter, onSearch, onSelect, onDelete, onAccept }: Props) {
  const filterColors: Record<CRMFilter, string> = {
    tous: "from-zinc-600 to-zinc-500",
    nouveau: "from-blue-600 to-cyan-500",
    qualifie: "from-yellow-500 to-orange-500",
    requests: "from-pink-600 to-violet-600",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <h1 className="text-lg font-black text-white mb-3 tracking-tight">Messages</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
          <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Rechercher..."
            className="w-full rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none border border-white/5 focus:border-violet-500/50 transition-colors"
            style={{ background: "#13131a" }} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto">
        {FILTERS.map(({ key, label }) => (
          <button key={key} onClick={() => onFilter(key)}
            className={cn("flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
              filter === key
                ? `bg-gradient-to-r ${filterColors[key]} text-white shadow-lg`
                : "text-zinc-500 hover:text-white border border-white/5"
            )}>
            {label}
            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", filter === key ? "bg-white/20" : "bg-white/5")}>
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {convos.length === 0 && (
          <div className="text-center py-12 text-zinc-700 text-xs">Aucune conversation</div>
        )}
        {convos.map((c) => (
          <div key={c.id} onClick={() => onSelect(c.id)}
            className={cn("group relative flex items-center gap-3 px-4 py-3.5 cursor-pointer border-b border-white/3 transition-all",
              selectedId === c.id ? "bg-white/5 border-l-2 border-l-violet-500" : "hover:bg-white/3"
            )}>
            <div className="relative flex-shrink-0">
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-black text-white"
                style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
                {c.fullName[0]}
              </div>
              {c.unread > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #ec4899, #f97316)" }}>
                  {c.unread}
                </div>
              )}
              {c.isRequest && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center text-[9px] font-bold text-white">?</div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className={cn("text-sm truncate", c.unread > 0 ? "font-bold text-white" : "font-medium text-zinc-300")}>
                  {c.fullName}
                </span>
                <span className="text-[10px] text-zinc-600 ml-2 flex-shrink-0">{timeAgo(c.lastTs)}</span>
              </div>
              <p className={cn("text-xs truncate", c.unread > 0 ? "text-zinc-300" : "text-zinc-600")}>
                {c.lastMessage}
              </p>
              {c.status === "qualified" && (
                <span className="text-[9px] font-semibold text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded-full mt-1 inline-block">⭐ Qualifié</span>
              )}
            </div>

            <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 rounded-lg p-1" style={{ background: "#1a1a24" }}>
              {c.isRequest && (
                <button onClick={(e) => { e.stopPropagation(); onAccept(c.id); }}
                  className="p-1.5 text-emerald-400 hover:text-emerald-300 transition-colors rounded-lg hover:bg-emerald-500/10">
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}
              <button onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
