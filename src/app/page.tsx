import { Zap, MessageCircle, ImagePlay, TrendingUp, Users, Send } from "lucide-react";
import Link from "next/link";

const stats = [
  { label: "Skills disponibles", value: "6", icon: Zap, color: "text-yellow-400", bg: "bg-yellow-500/10" },
  { label: "Contenus générés", value: "0", icon: ImagePlay, color: "text-purple-400", bg: "bg-purple-500/10" },
  { label: "Leads actifs", value: "0", icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
  { label: "DMs envoyés", value: "0", icon: Send, color: "text-green-400", bg: "bg-green-500/10" },
];

const quickActions = [
  {
    href: "/skills",
    label: "Lancer un Skill IA",
    description: "Génère un hook, une caption ou un script Reel",
    icon: Zap,
    gradient: "from-yellow-500 to-orange-500",
  },
  {
    href: "/studio",
    label: "Studio Contenu",
    description: "Génère et programme un post Instagram",
    icon: ImagePlay,
    gradient: "from-pink-500 to-purple-600",
  },
  {
    href: "/crm",
    label: "Gérer les DMs",
    description: "Voir les leads et les conversations",
    icon: MessageCircle,
    gradient: "from-blue-500 to-cyan-500",
  },
];

export default function Dashboard() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Bonjour 👋</h1>
        <p className="text-zinc-400 mt-1">Tableau de bord IGFlow</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-zinc-400 mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Actions rapides</h2>
        <div className="grid grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-all hover:bg-zinc-800/50"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white">{action.label}</h3>
                <p className="text-sm text-zinc-400 mt-1">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="bg-gradient-to-r from-pink-500/10 to-purple-600/10 border border-pink-500/20 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white mb-1">Commence par les Skills IA</h3>
            <p className="text-sm text-zinc-400">
              Les skills sont des workflows IA pré-configurés pour les tâches répétitives.
              Lance le <strong className="text-white">Générateur de Hooks</strong> pour créer tes prochains Reels en 30 secondes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
