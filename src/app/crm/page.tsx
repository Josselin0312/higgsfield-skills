"use client";

import { useState } from "react";
import { Search, Plus, AtSign, Clock, Tag } from "lucide-react";
import { type LeadStatus } from "@/lib/types";

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string }> = {
  new: { label: "Nouveau", color: "text-zinc-400", bg: "bg-zinc-700/50" },
  contacted: { label: "Contacté", color: "text-blue-400", bg: "bg-blue-500/20" },
  qualified: { label: "Qualifié", color: "text-yellow-400", bg: "bg-yellow-500/20" },
  proposal: { label: "Offre envoyée", color: "text-purple-400", bg: "bg-purple-500/20" },
  closed: { label: "Closé ✓", color: "text-green-400", bg: "bg-green-500/20" },
  lost: { label: "Perdu", color: "text-red-400", bg: "bg-red-500/20" },
};

const mockLeads = [
  {
    id: "1",
    igUsername: "thomas.entrepreneur",
    fullName: "Thomas",
    status: "qualified" as LeadStatus,
    assignedTo: "Sophie",
    notes: "Intéressé par la formation, a posé des questions sur le prix",
    lastContact: "Il y a 2h",
    tags: ["chaud", "formation"],
  },
  {
    id: "2",
    igUsername: "marie_freelance",
    fullName: "Marie",
    status: "contacted" as LeadStatus,
    assignedTo: "Lucas",
    notes: "A répondu à mon hook sur le freelancing",
    lastContact: "Il y a 5h",
    tags: ["freelance"],
  },
  {
    id: "3",
    igUsername: "kevin.business",
    fullName: "Kevin",
    status: "proposal" as LeadStatus,
    assignedTo: "Sophie",
    notes: "Devis envoyé 2500€, en attente de réponse",
    lastContact: "Hier",
    tags: ["chaud", "décision"],
  },
  {
    id: "4",
    igUsername: "sarah_coach",
    fullName: "Sarah",
    status: "new" as LeadStatus,
    assignedTo: "Lucas",
    notes: "A commenté le Reel sur les 10k€/mois",
    lastContact: "Il y a 30min",
    tags: ["froid"],
  },
];

const setters = ["Tous", "Sophie", "Lucas", "Moi"];

export default function CRMPage() {
  const [search, setSearch] = useState("");
  const [activeSetter, setActiveSetter] = useState("Tous");
  const [activeStatus, setActiveStatus] = useState<LeadStatus | "all">("all");
  const [selectedLead, setSelectedLead] = useState<string | null>(null);

  const filtered = mockLeads.filter((l) => {
    const matchSearch =
      !search ||
      l.igUsername.toLowerCase().includes(search.toLowerCase()) ||
      l.fullName?.toLowerCase().includes(search.toLowerCase());
    const matchSetter = activeSetter === "Tous" || l.assignedTo === activeSetter;
    const matchStatus = activeStatus === "all" || l.status === activeStatus;
    return matchSearch && matchSetter && matchStatus;
  });

  const selected = mockLeads.find((l) => l.id === selectedLead);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">CRM DM</h1>
          <p className="text-zinc-400 mt-1">Gérez vos leads Instagram en équipe</p>
        </div>
        <button className="flex items-center gap-2 bg-white text-black font-semibold px-4 py-2.5 rounded-xl hover:bg-zinc-200 transition-colors text-sm">
          <Plus className="w-4 h-4" />
          Ajouter un lead
        </button>
      </div>

      {/* Kanban status bar */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveStatus("all")}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
            activeStatus === "all"
              ? "bg-white text-black border-white"
              : "bg-transparent text-zinc-400 border-zinc-700 hover:text-white"
          }`}
        >
          Tous ({mockLeads.length})
        </button>
        {(Object.keys(STATUS_CONFIG) as LeadStatus[]).map((status) => {
          const count = mockLeads.filter((l) => l.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                activeStatus === status
                  ? "bg-white text-black border-white"
                  : `bg-transparent ${STATUS_CONFIG[status].color} border-zinc-700 hover:border-zinc-500`
              }`}
            >
              {STATUS_CONFIG[status].label} ({count})
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Lead List */}
        <div className="col-span-2 space-y-3">
          {/* Search & Filters */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Rechercher un lead..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
              {setters.map((setter) => (
                <button
                  key={setter}
                  onClick={() => setActiveSetter(setter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeSetter === setter
                      ? "bg-white text-black"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {setter}
                </button>
              ))}
            </div>
          </div>

          {/* Leads */}
          {filtered.map((lead) => (
            <div
              key={lead.id}
              onClick={() => setSelectedLead(lead.id === selectedLead ? null : lead.id)}
              className={`bg-zinc-900 border rounded-xl p-4 cursor-pointer transition-all ${
                selectedLead === lead.id
                  ? "border-zinc-500"
                  : "border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-sm font-bold text-white">
                    {lead.fullName?.[0] || lead.igUsername[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white text-sm">{lead.fullName || lead.igUsername}</span>
                      <span className="text-zinc-500 text-xs flex items-center gap-1">
                        <AtSign className="w-3 h-3" />
                        @{lead.igUsername}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{lead.notes}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_CONFIG[lead.status].bg} ${STATUS_CONFIG[lead.status].color}`}
                  >
                    {STATUS_CONFIG[lead.status].label}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {lead.lastContact}
                    </span>
                    <span className="text-zinc-600">→ {lead.assignedTo}</span>
                  </div>
                </div>
              </div>
              {lead.tags.length > 0 && (
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {lead.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Tag className="w-2.5 h-2.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-zinc-600">Aucun lead trouvé</p>
            </div>
          )}
        </div>

        {/* Lead Detail */}
        <div>
          {selected ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sticky top-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-base font-bold text-white">
                  {selected.fullName?.[0] || selected.igUsername[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{selected.fullName}</h3>
                  <p className="text-xs text-zinc-400">@{selected.igUsername}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">Statut</p>
                  <select className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                    {(Object.keys(STATUS_CONFIG) as LeadStatus[]).map((s) => (
                      <option key={s} value={s} selected={s === selected.status}>
                        {STATUS_CONFIG[s].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">Assigné à</p>
                  <select className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                    {["Sophie", "Lucas", "Moi"].map((s) => (
                      <option key={s} selected={s === selected.assignedTo}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1.5">Notes</p>
                  <textarea
                    defaultValue={selected.notes}
                    rows={4}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none resize-none"
                  />
                </div>

                <button className="w-full bg-white text-black font-medium py-2.5 rounded-xl text-sm hover:bg-zinc-200 transition-colors">
                  Sauvegarder
                </button>

                <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity">
                  <AtSign className="w-4 h-4" />
                  Ouvrir sur Instagram
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
              <p className="text-zinc-500 text-sm">Clique sur un lead<br />pour voir les détails</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
