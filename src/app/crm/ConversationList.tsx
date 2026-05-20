"use client";

import { Search, Trash2, Check, UserCheck } from "lucide-react";
import { type Conversation } from "@/lib/crmData";
import { type CRMFilter } from "./page";
import { cn } from "@/lib/utils";

const FILTERS: { key: CRMFilter; label: (c: Record<CRMFilter, number>) => string }[] = [
  { key: "tous", label: (c) => `Tous (${c.tous})` },
  { key: "nouveau", label: (c) => `Nouveau (${c.nouveau})` },
  { key: "qualifie", label: (c) => `Qualifié (${c.qualifie})` },
  { key: "requests", label: (c) => `Requests (${c.requests})` },
];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "maintenant";
  if (m < 60) return `${m}min`;
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
  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <div className="px-4 pt-6 pb-3 border-b border-zinc-800">
        <h1 className="text-xl font-bold text-white mb-3">Messages</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1 px-3 py-2 border-b border-zinc-800 overflow-x-auto">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onFilter(key)}
            className={cn(
              "flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all",
              filter === key ? "bg-white text-black" : "text-zinc-400 hover:text-white"
            )}
          >
            {label(counts)}
            {key === "requests" && counts.requests > 0 && filter !== "requests" && (
              <span className="ml-1 w-1.5 h-1.5 rounded-full bg-pink-500 inline-block" />
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {convos.length === 0 && (
          <div className="text-center py-12 text-zinc-600 text-xs">Aucune conversation</div>
        )}
        {convos.map((c) => (
          <div
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={cn(
              "group relative flex items-center gap-3 px-4 py-3.5 cursor-pointer border-b border-zinc-900 transition-colors",
              selectedId === c.id ? "bg-zinc-800" : "hover:bg-zinc-900/60"
            )}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-sm font-bold text-white">
                {c.fullName[0]}
              </div>
              {c.unread > 0 && (
                <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-pink-500 flex items-center justify-center text-[9px] font-bold text-white">
                  {c.unread}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={cn("text-sm truncate", c.unread > 0 ? "font-semibold text-white" : "font-medium text-zinc-300")}>
                  {c.fullName}
                </span>
                <span className="text-xs text-zinc-600 ml-2 flex-shrink-0">{timeAgo(c.lastTs)}</span>
              </div>
              <p className={cn("text-xs truncate mt-0.5", c.unread > 0 ? "text-white" : "text-zinc-500")}>
                {c.lastMessage}
              </p>
            </div>

            {/* Actions on hover */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-zinc-800 rounded-lg p-1">
              {c.isRequest && (
                <button
                  onClick={(e) => { e.stopPropagation(); onAccept(c.id); }}
                  className="p-1 text-green-400 hover:text-green-300 transition-colors"
                  title="Accepter"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                className="p-1 text-zinc-400 hover:text-red-400 transition-colors"
                title="Supprimer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
