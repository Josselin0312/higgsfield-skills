"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ImagePlay,
  MessageCircle,
  Settings,
  Camera,
  Zap,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/studio", label: "Studio", icon: ImagePlay },
  { href: "/skills", label: "Skills IA", icon: Zap },
  { href: "/crm", label: "CRM DM", icon: MessageCircle },
  { href: "/settings", label: "Paramètres", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

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
                active
                  ? "bg-white/10 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* IG Account Badge */}
      <div className="px-4 py-4 border-t border-zinc-800">
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
      </div>
    </div>
  );
}
