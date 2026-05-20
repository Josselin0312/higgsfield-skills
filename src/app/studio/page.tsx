"use client";

import { useState } from "react";
import { ImagePlay, Video, FileText, Share2, Clock, Plus, Sparkles } from "lucide-react";
import Link from "next/link";

const contentTypes = [
  { id: "post", label: "Post", icon: ImagePlay },
  { id: "reel", label: "Reel", icon: Video },
  { id: "story", label: "Story", icon: FileText },
];

const mockDrafts = [
  {
    id: "1",
    type: "post",
    caption: "3 erreurs qui t'empêchent de faire 10k€/mois...\n\nJ'en ai fait 2 sur 3 pendant 2 ans.",
    status: "draft",
    createdAt: "Il y a 2h",
  },
  {
    id: "2",
    type: "reel",
    caption: "Hook : La vérité sur le business en ligne que personne ne te dit",
    status: "scheduled",
    createdAt: "Il y a 5h",
  },
];

export default function StudioPage() {
  const [activeType, setActiveType] = useState("post");

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Studio</h1>
          <p className="text-zinc-400 mt-1">Crée et programme ton contenu Instagram</p>
        </div>
        <Link
          href="/skills"
          className="flex items-center gap-2 bg-white text-black font-semibold px-4 py-2.5 rounded-xl hover:bg-zinc-200 transition-colors text-sm"
        >
          <Sparkles className="w-4 h-4" />
          Générer avec un Skill
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Editor */}
        <div className="col-span-2 space-y-4">
          {/* Type selector */}
          <div className="flex gap-2">
            {contentTypes.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveType(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                  activeType === id
                    ? "bg-white text-black border-white"
                    : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-600"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Visual upload */}
          <div className="bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-xl h-48 flex flex-col items-center justify-center gap-3 hover:border-zinc-500 transition-colors cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
              <Plus className="w-5 h-5 text-zinc-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-300">Ajouter un visuel</p>
              <p className="text-xs text-zinc-500 mt-0.5">PNG, JPG, MP4 — ou génère avec l&apos;IA</p>
            </div>
          </div>

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Caption</label>
            <textarea
              rows={6}
              placeholder="Écris ta caption ici, ou utilise le Skill IA pour la générer automatiquement..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-zinc-600 resize-none placeholder-zinc-600"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity text-sm">
              <Share2 className="w-4 h-4" />
              Poster sur Instagram
            </button>
            <button className="flex items-center justify-center gap-2 bg-zinc-800 text-white font-medium px-5 py-3 rounded-xl hover:bg-zinc-700 transition-colors text-sm">
              <Clock className="w-4 h-4" />
              Programmer
            </button>
            <button className="flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-700 text-zinc-400 font-medium px-5 py-3 rounded-xl hover:text-white hover:border-zinc-600 transition-colors text-sm">
              Sauvegarder
            </button>
          </div>
        </div>

        {/* Right: Drafts */}
        <div>
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide mb-4">
            Brouillons récents
          </h3>
          <div className="space-y-3">
            {mockDrafts.map((draft) => (
              <div
                key={draft.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 cursor-pointer hover:border-zinc-700 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-zinc-500 uppercase">
                    {draft.type}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      draft.status === "scheduled"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-zinc-700 text-zinc-400"
                    }`}
                  >
                    {draft.status === "scheduled" ? "Programmé" : "Brouillon"}
                  </span>
                </div>
                <p className="text-sm text-zinc-300 line-clamp-2 leading-relaxed">
                  {draft.caption}
                </p>
                <p className="text-xs text-zinc-600 mt-2">{draft.createdAt}</p>
              </div>
            ))}

            {mockDrafts.length === 0 && (
              <div className="text-center py-8">
                <p className="text-zinc-600 text-sm">Aucun brouillon</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
