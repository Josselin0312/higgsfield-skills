"use client";

import { useState } from "react";
import { Search, Plus, AtSign, Clock, Tag, ChevronRight } from "lucide-react";
import { type LeadStatus } from "@/lib/types";

type Filter = "tous" | "nouveau" | "qualifie";

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string }> = {
  new: { label: "Nouveau", color: "text-zinc-400", bg: "bg-zinc-700/50" },
  contacted: { label: "Contacté", color: "text-blue-400", bg: "bg-blue-500/20" },
  qualified: { label: "Qualifié", color: "text-yellow-400", bg: "bg-yellow-500/20" },
  proposal: { label: "Offre envoyée", color: "text-purple-400", bg: "bg-purple-500/20" },
  closed: { label: "Closé ✓", color: "text-green-400", bg: "bg-green-500/20" },
  lost: { label: "Perdu", color: "text-red-400", bg: "bg-red-500/20" },
};

const mockLeads = [
  { id: "1", igUsername: "thomas.entrepreneur", fullName: "Thomas", status: "qualified" as LeadStatus, assignedTo: "Sophie", notes: "Intéressé par la formation, a posé des questions sur le prix", lastContact: new Date(Date.now() - 2 * 3600000).toISOString(), tags: ["chaud"] },
  { id: "2", igUsername: "marie_freelance", fullName: "Marie", status: "new" as LeadStatus, assignedTo: "Lucas", notes: "A répondu au hook sur le freelancing", lastContact: new Date(Date.now() - 5 * 3600000).toISOString(), tags: [] },
  { id: "3", igUsername: "kevin.business", fullName: "Kevin", status: "qualified" as LeadStatus, assignedTo: "Sophie", notes: "Devis envoyé 2500€, en attente", lastContact: new Date(Date.now() - 30 * 3600000).toISOString(), tags: ["chaud"] },
  { id: "4", igUsername: "sarah_coach", fullName: "Sarah", status: "new" as LeadStatus, assignedTo: "Lucas", notes: "A commenté le Reel", lastContact: new Date(Date.now() - 20 * 60000).toISOString(), tags: [] },
];

function isNew(lastContact: string) {
  return Date.now() - new Date(lastContact).getTime() < 24 * 3600000;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `Il y a ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  return `Il y a ${Math.floor(h / 24)}j`;
}

export default function CRMPage() {
  const [filter, setFilter] = useState<Filter>("tous");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [leads, setLeads] = useState(mockLeads);

  const filtered = leads.filter((l) => {
    const matchSearch = !search || l.igUsername.includes(search.toLowerCase()) || l.fullName?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "tous" ||
      (filter === "nouveau" && isNew(l.lastContact)) ||
      (filter === "qualifie" && l.status === "qualified");
    return matchSearch && matchFilter;
  });

  const counts = {
    tous: leads.length,
    nouveau: leads.filter((l) => isNew(l.lastContact)).length,
    qualifie: leads.filter((l) => l.status === "qualified").length,
  };

  const selected = leads.find((l) => l.id === selectedId);

  const setQualified = (id: string) => {
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status: "qualified" as LeadStatus } : l));
  };

  const filters: { key: Filter; label: string }[] = [
    { key: "tous", label: `Tous (${counts.tous})` },
    { key: "nouveau", label: `Nouveau (${counts.nouveau})` },
    { key: "qualifie", label: `Qualifié (${counts.qualifie})` },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">CRM DM</h1>
        <button className="flex items-center gap-2 bg-white text-black font-semibold px-4 py-2.5 rounded-xl hover:bg-zinc-200 transition-colors text-sm">
          <Plus className="w-4 h-4" /> Ajouter un lead
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5">
        {filters.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
              filter === key ? "bg-white text-black border-white" : "bg-transparent text-zinc-400 border-zinc-700 hover:text-white hover:border-zinc-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* List */}
        <div className="col-span-2 space-y-2">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
            />
          </div>

          {filtered.map((lead) => (
            <div
              key={lead.id}
              onClick={() => setSelectedId(lead.id === selectedId ? null : lead.id)}
              className={`bg-zinc-900 border rounded-xl p-4 cursor-pointer transition-all ${selectedId === lead.id ? "border-zinc-500" : "border-zinc-800 hover:border-zinc-700"}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                    {lead.fullName?.[0] || lead.igUsername[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white text-sm">{lead.fullName}</span>
                      <span className="text-zinc-500 text-xs flex items-center gap-0.5"><AtSign className="w-3 h-3" />{lead.igUsername}</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{lead.notes}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CONFIG[lead.status].bg} ${STATUS_CONFIG[lead.status].color}`}>
                    {STATUS_CONFIG[lead.status].label}
                  </span>
                  <span className="text-xs text-zinc-600 flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(lead.lastContact)}</span>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-zinc-600 text-sm">Aucun lead</div>
          )}
        </div>

        {/* Detail */}
        <div>
          {selected ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sticky top-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-base font-bold text-white">
                  {selected.fullName?.[0]}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{selected.fullName}</h3>
                  <p className="text-xs text-zinc-400 flex items-center gap-0.5"><AtSign className="w-3 h-3" />{selected.igUsername}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1.5">Statut</p>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_CONFIG[selected.status].bg} ${STATUS_CONFIG[selected.status].color}`}>
                  {STATUS_CONFIG[selected.status].label}
                </span>
              </div>

              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1.5">Notes</p>
                <textarea
                  defaultValue={selected.notes}
                  rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none resize-none"
                />
              </div>

              {selected.status !== "qualified" && (
                <button
                  onClick={() => setQualified(selected.id)}
                  className="w-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-medium py-2.5 rounded-xl text-sm hover:bg-yellow-500/30 transition-colors"
                >
                  ✓ Marquer comme Qualifié
                </button>
              )}

              <button className="w-full bg-white text-black font-medium py-2.5 rounded-xl text-sm hover:bg-zinc-200 transition-colors">
                Sauvegarder
              </button>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
              <p className="text-zinc-600 text-sm">Clique sur un lead pour voir les détails</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
