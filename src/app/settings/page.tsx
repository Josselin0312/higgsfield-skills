"use client";

import { useState } from "react";
import { Camera, Key, Users, Save, CheckCircle } from "lucide-react";

const setters = [
  { id: "1", name: "Sophie", role: "setter", color: "from-pink-400 to-rose-500" },
  { id: "2", name: "Lucas", role: "closer", color: "from-blue-400 to-indigo-500" },
];

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Paramètres</h1>
        <p className="text-zinc-400 mt-1">Configure ta plateforme IGFlow</p>
      </div>

      <div className="space-y-6">
        {/* Instagram Connection */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-semibold text-white">Compte Instagram</h2>
          </div>

          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">
                Token d&apos;accès Instagram
              </label>
              <input
                type="password"
                placeholder="IGQV..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
              <p className="text-xs text-zinc-500 mt-1.5">
                Obtenir via Meta for Developers → Graph API Explorer
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">
                ID du compte Instagram
              </label>
              <input
                type="text"
                placeholder="17841400..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-400">
            <span>⚠️</span>
            <span>Nécessite un compte Instagram Business ou Creator connecté à une Page Facebook</span>
          </div>
        </div>

        {/* AI API Key */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Key className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-semibold text-white">Clé API IA (Claude)</h2>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">
              Anthropic API Key
            </label>
            <input
              type="password"
              placeholder="sk-ant-..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
            <p className="text-xs text-zinc-500 mt-1.5">
              Variable d&apos;env : <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">ANTHROPIC_API_KEY</code> dans le fichier <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">.env.local</code>
            </p>
          </div>
        </div>

        {/* Team */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <h2 className="font-semibold text-white">Équipe</h2>
            </div>
            <button className="text-xs text-zinc-400 hover:text-white transition-colors border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded-lg">
              + Ajouter
            </button>
          </div>

          <div className="space-y-2">
            {setters.map((setter) => (
              <div key={setter.id} className="flex items-center justify-between bg-zinc-800 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${setter.color} flex items-center justify-center text-xs font-bold text-white`}>
                    {setter.name[0]}
                  </div>
                  <span className="text-sm font-medium text-white">{setter.name}</span>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  setter.role === "closer"
                    ? "bg-purple-500/20 text-purple-400"
                    : "bg-blue-500/20 text-blue-400"
                }`}>
                  {setter.role === "closer" ? "Closer" : "Setter"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          className={`w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition-all text-sm ${
            saved
              ? "bg-green-500 text-white"
              : "bg-white text-black hover:bg-zinc-200"
          }`}
        >
          {saved ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Sauvegardé !
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Sauvegarder les paramètres
            </>
          )}
        </button>
      </div>
    </div>
  );
}
