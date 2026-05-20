"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sparkles, MessageCircle, Settings, Zap, ChevronDown, Shield, LogOut, Flame } from "lucide-react";
import { useRole } from "@/lib/role";
import { useAccount } from "@/lib/accountStore";
import { useState } from "react";

const navItems = [
  { href: "/generation", label: "Génération", icon: Sparkles, color: "#ff2d78" },
  { href: "/crm", label: "CRM DM", icon: MessageCircle, color: "#bf80ff" },
  { href: "/skills", label: "Skills IA", icon: Zap, color: "#ffd700" },
  { href: "/settings", label: "Paramètres", icon: Settings, color: "rgba(255,215,0,0.4)" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, setUser, users } = useRole();
  const { activeAccount, logout } = useAccount();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col h-full w-64 flex-shrink-0" style={{ background: "#0a0618", borderRight: "1px solid rgba(255,215,0,0.1)" }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: "1px solid rgba(255,215,0,0.1)" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #ff2d78, #7c00ff)", boxShadow: "0 0 15px rgba(255,45,120,0.4)" }}>
          <Flame className="w-4 h-4 text-white" />
        </div>
        <span className="font-black text-xl tracking-tight">
          <span style={{ background: "linear-gradient(135deg, #ffd700, #ff8c00)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Slide</span>
          <span className="text-white">In</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon, color }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={active ? {
                background: "rgba(255,215,0,0.06)",
                borderLeft: `2px solid ${color}`,
                color: color,
              } : {
                color: "rgba(255,255,255,0.35)",
                borderLeft: "2px solid transparent",
              }}>
              <Icon className="w-4 h-4" />
              {label}
              {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* IG Account */}
      {activeAccount && (
        <div className="px-3 pb-2 pt-3" style={{ borderTop: "1px solid rgba(255,215,0,0.1)" }}>
          <div className="rounded-xl px-3 py-2.5 flex items-center gap-2.5"
            style={{ background: "rgba(255,215,0,0.05)", border: "1px solid rgba(255,215,0,0.15)" }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #ff8c00, #ff2d78)" }}>
              {activeAccount.username[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">@{activeAccount.username}</p>
              <p className="text-[10px] flex items-center gap-1" style={{ color: "#00ff88" }}>
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#00ff88" }} /> Connecté
              </p>
            </div>
            <button onClick={logout} className="transition-colors" style={{ color: "rgba(255,215,0,0.4)" }}>
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Role switcher */}
      <div className="px-3 pb-4 relative">
        <button onClick={() => setOpen(!open)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors"
          style={{ color: "rgba(255,215,0,0.5)" }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white"
            style={{ background: user.role === "admin" ? "linear-gradient(135deg, #ffd700, #ff8c00)" : "linear-gradient(135deg, #7c00ff, #bf00ff)" }}>
            {user.name[0]}
          </div>
          <div className="flex-1 text-left">
            <p className="text-xs font-bold text-white">{user.name}</p>
            <p className="text-[10px] flex items-center gap-1" style={{ color: "rgba(255,215,0,0.4)" }}>
              {user.role === "admin" && <Shield className="w-2.5 h-2.5" />}
              {user.role === "admin" ? "Admin" : "Setter"}
            </p>
          </div>
          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} style={{ color: "rgba(255,215,0,0.3)" }} />
        </button>

        {open && (
          <div className="absolute bottom-full mb-1 left-3 right-3 rounded-xl overflow-hidden shadow-2xl"
            style={{ background: "#150d2a", border: "1px solid rgba(255,215,0,0.2)" }}>
            {users.map((u) => (
              <button key={u.name} onClick={() => { setUser(u); setOpen(false); }}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors", user.name === u.name ? "bg-white/5" : "hover:bg-white/5")}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white"
                  style={{ background: u.role === "admin" ? "linear-gradient(135deg, #ffd700, #ff8c00)" : "linear-gradient(135deg, #7c00ff, #bf00ff)" }}>
                  {u.name[0]}
                </div>
                <span className="text-white text-sm">{u.name}</span>
                {u.role === "admin" && <Shield className="w-3 h-3 ml-auto" style={{ color: "#ffd700" }} />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
