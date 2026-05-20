"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ImagePlay, MessageCircle, Settings, Zap, ChevronDown, Shield, LogOut, Flame } from "lucide-react";
import { useRole } from "@/lib/role";
import { useAccount } from "@/lib/accountStore";
import { useState } from "react";

const navItems = [
  { href: "/studio", label: "Studio", icon: ImagePlay, color: "text-pink-400" },
  { href: "/crm", label: "CRM DM", icon: MessageCircle, color: "text-violet-400" },
  { href: "/skills", label: "Skills IA", icon: Zap, color: "text-orange-400" },
  { href: "/settings", label: "Paramètres", icon: Settings, color: "text-zinc-400" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, setUser, users } = useRole();
  const { activeAccount, logout } = useAccount();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col h-full w-64 flex-shrink-0 border-r border-white/5" style={{ background: "#0a0a0f" }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #a855f7, #ec4899)" }}>
          <Flame className="w-4.5 h-4.5 text-white" />
        </div>
        <span className="font-black text-xl tracking-tight">
          <span className="gradient-text">Slide</span><span className="text-white">In</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon, color }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active
                  ? "bg-white/10 text-white"
                  : "text-zinc-500 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className={cn("w-4 h-4", active ? color : "")} />
              {label}
              {active && <div className={cn("ml-auto w-1.5 h-1.5 rounded-full", color.replace("text-", "bg-"))} />}
            </Link>
          );
        })}
      </nav>

      {/* IG Account */}
      {activeAccount && (
        <div className="px-3 pb-2 border-t border-white/5 pt-3">
          <div className="gradient-border rounded-xl px-3 py-2.5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #f97316, #ec4899)" }}>
              {activeAccount.username[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">@{activeAccount.username}</p>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Connecté
              </p>
            </div>
            <button onClick={logout} className="text-zinc-600 hover:text-white transition-colors">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Role */}
      <div className="px-3 pb-4 relative">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors"
        >
          <div className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white",
            user.role === "admin" ? "" : ""
          )} style={{ background: user.role === "admin" ? "linear-gradient(135deg, #7c3aed, #a855f7)" : "linear-gradient(135deg, #2563eb, #06b6d4)" }}>
            {user.name[0]}
          </div>
          <div className="flex-1 text-left">
            <p className="text-xs font-semibold text-white">{user.name}</p>
            <p className="text-[10px] text-zinc-500 flex items-center gap-1">
              {user.role === "admin" && <Shield className="w-2.5 h-2.5" />}
              {user.role === "admin" ? "Admin" : "Setter"}
            </p>
          </div>
          <ChevronDown className={cn("w-3.5 h-3.5 text-zinc-600 transition-transform", open && "rotate-180")} />
        </button>

        {open && (
          <div className="absolute bottom-full mb-1 left-3 right-3 rounded-xl overflow-hidden shadow-2xl border border-white/10" style={{ background: "#13131a" }}>
            {users.map((u) => (
              <button key={u.name} onClick={() => { setUser(u); setOpen(false); }}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-white/5 transition-colors", user.name === u.name && "bg-white/5")}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: u.role === "admin" ? "linear-gradient(135deg, #7c3aed, #a855f7)" : "linear-gradient(135deg, #2563eb, #06b6d4)" }}>
                  {u.name[0]}
                </div>
                <span className="text-white text-sm">{u.name}</span>
                {u.role === "admin" && <Shield className="w-3 h-3 text-violet-400 ml-auto" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
