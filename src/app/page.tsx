"use client";

import { useState } from "react";
import { useAccount } from "@/lib/accountStore";
import { Plus, X, AtSign, Lock, Trash2, Camera } from "lucide-react";

export default function Page() {
  const { accounts, activeAccount, addAccount, removeAccount, selectAccount } = useAccount();
  const [showForm, setShowForm] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Si compte actif → dashboard vide
  if (activeAccount) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-zinc-500 text-sm">@{activeAccount.username}</p>
      </div>
    );
  }

  const handleAdd = () => {
    if (!username.trim() || !password.trim()) return;
    addAccount(username.trim(), password.trim());
    setUsername(""); setPassword(""); setShowForm(false);
  };

  const colors = ["from-pink-500 to-rose-500", "from-purple-500 to-indigo-500", "from-blue-500 to-cyan-500", "from-orange-500 to-amber-500"];

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8">
      <div className="flex items-center gap-3 mb-12">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
          <Camera className="w-5 h-5 text-white" />
        </div>
        <span className="text-2xl font-bold text-white">IGFlow</span>
      </div>

      <h1 className="text-xl font-semibold text-white mb-1">Choisir un compte</h1>
      <p className="text-zinc-500 text-sm mb-8">Sélectionne le compte Instagram sur lequel travailler</p>

      <div className="w-full max-w-sm space-y-3">
        {accounts.map((account, i) => (
          <div key={account.id} className="group relative">
            <button
              onClick={() => selectAccount(account)}
              className="w-full flex items-center gap-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-4 transition-all hover:bg-zinc-800/60 text-left"
            >
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${colors[i % colors.length]} flex items-center justify-center text-lg font-bold text-white flex-shrink-0`}>
                {account.username[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white">@{account.username}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <p className="text-xs text-zinc-500">Connecté</p>
                </div>
              </div>
              <span className="text-zinc-600 group-hover:text-white transition-colors text-lg">→</span>
            </button>
            <button
              onClick={() => removeAccount(account.id)}
              className="absolute top-4 right-12 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-zinc-600 hover:text-red-400"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center gap-4 border-2 border-dashed border-zinc-800 hover:border-zinc-600 rounded-2xl p-4 transition-all text-zinc-500 hover:text-zinc-300"
          >
            <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium">Ajouter un compte Instagram</span>
          </button>
        ) : (
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-white">Nouveau compte</p>
              <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Identifiant Instagram"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>
            <button
              onClick={handleAdd}
              className="w-full bg-white text-black font-semibold py-2.5 rounded-xl text-sm hover:bg-zinc-200 transition-colors"
            >
              Ajouter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
