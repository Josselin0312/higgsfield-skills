"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ImagePlay, MessageCircle, Settings, Camera, Zap, ChevronDown, Shield } from "lucide-react";
import { useRole } from "@/lib/role";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/studio", label: "Studio", icon: ImagePlay },
  { href: "/skills", label: "Skills IA", icon: Zap },
  { href: "/crm", label: "CRM DM", icon: MessageCircle },
  { href: "/settings", label: "Paramètres", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, setUser, users } = useRole();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen w-64 bg-zinc-900 border-r border-zinc-800 fixed left-0 top-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-zinc-800">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
          <Camera className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-white text-lg">IGFlow</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User / Role switcher */}
      <div className="px-4 py-4 border-t border-zinc-800 space-y-2">
        {/* IG Account */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-zinc-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center text-xs font-bold text-white">
            IG
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white font-medium truncate">@moncompte</p>
            <p className="text-xs text-zinc-500">Connecté</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-400" />
        </div>

        {/* Role switcher (demo) */}
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 transition-colors"
          >
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white",
              user.role === "admin" ? "bg-gradient-to-br from-purple-500 to-indigo-600" : "bg-gradient-to-br from-blue-400 to-cyan-500"
            )}>
              {user.name[0]}
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-medium text-white">{user.name}</p>
              <p className="text-xs text-zinc-500 flex items-center gap-1">
                {user.role === "admin" && <Shield className="w-2.5 h-2.5" />}
                {user.role === "admin" ? "Admin" : "Setter"}
              </p>
            </div>
            <ChevronDown className={cn("w-3.5 h-3.5 text-zinc-500 transition-transform", open && "rotate-180")} />
          </button>

          {open && (
            <div className="absolute bottom-full mb-1 left-0 right-0 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden shadow-xl">
              <p className="text-xs text-zinc-500 px-3 pt-2.5 pb-1.5 uppercase tracking-wide font-medium">Changer de profil</p>
              {users.map((u) => (
                <button
                  key={u.name}
                  onClick={() => { setUser(u); setOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-zinc-700 transition-colors",
                    user.name === u.name && "bg-zinc-700/50"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white",
                    u.role === "admin" ? "bg-gradient-to-br from-purple-500 to-indigo-600" : "bg-gradient-to-br from-blue-400 to-cyan-500"
                  )}>
                    {u.name[0]}
                  </div>
                  <span className="text-white">{u.name}</span>
                  {u.role === "admin" && <Shield className="w-3 h-3 text-purple-400 ml-auto" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
