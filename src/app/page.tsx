"use client";

import { useState } from "react";
import { useAccount } from "@/lib/accountStore";
import { Plus, X, AtSign, Lock, Trash2, Flame } from "lucide-react";
import Link from "next/link";

const COLORS = [
  "linear-gradient(135deg, #a855f7, #ec4899)",
  "linear-gradient(135deg, #6366f1, #8b5cf6)",
  "linear-gradient(135deg, #f97316, #ec4899)",
  "linear-gradient(135deg, #06b6d4, #6366f1)",
];

export default function Page() {
  const { accounts, activeAccount, addAccount, removeAccount, selectAccount } = useAccount();
  const [showForm, setShowForm] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  if (activeAccount) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-zinc-600 text-sm">Compte actif : @{activeAccount.username}</p>
        <Link href="/crm" className="text-white font-bold px-6 py-3 rounded-2xl transition-all"
          style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
          Aller au CRM DM →
        </Link>
      </div>
    );
  }

  const handleAdd = () => {
    if (!username.trim() || !password.trim()) return;
    addAccount(username.trim(), password.trim());
    setUsername(""); setPassword(""); setShowForm(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ background: "#060608" }}>
      {/* Logo */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ background: "linear-gradient(135deg, #a855f7, #ec4899)", boxShadow: "0 0 30px rgba(168,85,247,0.4)" }}>
          <Flame className="w-6 h-6 text-white" />
        </div>
        <span className="text-3xl font-black tracking-tight">
          <span style={{ background: "linear-gradient(135deg, #a855f7, #ec4899, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Slide</span>
          <span className="text-white">In</span>
        </span>
      </div>
      <p className="text-zinc-600 text-sm mb-10">Ton studio d'acquisition Instagram</p>

      <div className="w-full max-w-xs space-y-3">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest text-center mb-4">Choisir un compte</p>

        {accounts.map((account, i) => (
          <div key={account.id} className="group relative">
            <button onClick={() => selectAccount(account)}
              className="w-full flex items-center gap-4 rounded-2xl p-4 transition-all border border-white/5 hover:border-white/10 text-left"
              style={{ background: "#0d0d14" }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black text-white flex-shrink-0"
                style={{ background: COLORS[i % COLORS.length] }}>
                {account.username[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white">@{account.username}</p>
                <p className="text-xs text-emerald-400 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Connecté
                </p>
              </div>
              <span className="text-zinc-600 group-hover:text-white transition-colors">→</span>
            </button>
            <button onClick={() => removeAccount(account.id)}
              className="absolute top-4 right-10 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-zinc-600 hover:text-red-400">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {!showForm ? (
          <button onClick={() => setShowForm(true)}
            className="w-full flex items-center gap-4 border-2 border-dashed border-white/10 hover:border-violet-500/40 rounded-2xl p-4 transition-all text-zinc-600 hover:text-zinc-300">
            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold">Ajouter un compte</span>
          </button>
        ) : (
          <div className="rounded-2xl p-5 space-y-3 border border-white/10" style={{ background: "#0d0d14" }}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-white">Nouveau compte</p>
              <button onClick={() => setShowForm(false)} className="text-zinc-600 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input type="text" placeholder="Identifiant Instagram" value={username} onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none border border-white/5 focus:border-violet-500/50 transition-colors"
                style={{ background: "#13131a" }} />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none border border-white/5 focus:border-violet-500/50 transition-colors"
                style={{ background: "#13131a" }} />
            </div>
            <button onClick={handleAdd} className="w-full font-bold py-2.5 rounded-xl text-sm text-white transition-all"
              style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
              Ajouter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
