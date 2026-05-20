"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Heart, Image, Smile, Mic, MoreHorizontal, Trash2, ChevronDown, Play, Star, Info, X } from "lucide-react";
import { type Conversation, AUDIO_LIBRARY } from "@/lib/crmData";
import { cn } from "@/lib/utils";

const EMOJIS = ["❤️", "😂", "🔥", "👏", "😮", "😢", "😡", "👍", "💯", "🙏"];
const QUICK_REPLIES = [
  "Salut ! T'as vu mon dernier post ?",
  "C'est quoi ta situation actuelle ?",
  "Ok je comprends. T'as déjà essayé de… ?",
  "Je t'envoie les infos 👇",
  "On peut faire un point rapide ?",
  "C'est exactement ce qu'on règle ici 🔥",
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

interface Props {
  convo: Conversation;
  onSend: (content: string, type?: "text" | "audio", audioName?: string) => void;
  onQualify: () => void;
  onDelete: () => void;
}

export default function ChatView({ convo, onSend, onQualify, onDelete }: Props) {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  const [showQuick, setShowQuick] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [convo.messages]);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
    setShowQuick(false);
  };

  const closeAll = () => { setShowEmoji(false); setShowAudio(false); setShowQuick(false); };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 flex-shrink-0" style={{ background: "#0a0a0f" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white"
            style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
            {convo.fullName[0]}
          </div>
          <div>
            <p className="text-sm font-bold text-white">{convo.fullName}</p>
            <p className="text-xs text-zinc-500">@{convo.igUsername}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {convo.status !== "qualified" ? (
            <button onClick={onQualify}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
              style={{ background: "rgba(234,179,8,0.05)" }}>
              <Star className="w-3 h-3" /> Qualifier
            </button>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full text-yellow-400 border border-yellow-500/30"
              style={{ background: "rgba(234,179,8,0.05)" }}>
              <Star className="w-3 h-3 fill-yellow-400" /> Qualifié
            </span>
          )}
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-zinc-500 hover:text-white transition-colors rounded-lg hover:bg-white/5">
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 rounded-xl shadow-2xl overflow-hidden z-20 w-44 border border-white/10" style={{ background: "#13131a" }}>
                <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-400 hover:bg-white/5 transition-colors text-left">
                  <Info className="w-3.5 h-3.5" /> Infos du lead
                </button>
                <button onClick={() => { onDelete(); setShowMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition-colors text-left">
                  <Trash2 className="w-3.5 h-3.5" /> Supprimer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5">
        {convo.isRequest && (
          <div className="flex flex-col items-center py-6 gap-3">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black text-white"
              style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
              {convo.fullName[0]}
            </div>
            <p className="text-white font-bold">{convo.fullName}</p>
            <p className="text-zinc-500 text-sm">t'a envoyé une demande de message</p>
            <div className="flex gap-2">
              <button className="px-5 py-2 text-white text-sm font-bold rounded-xl transition-all"
                style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
                Accepter
              </button>
              <button className="px-5 py-2 text-zinc-400 text-sm font-bold rounded-xl border border-white/10 hover:bg-white/5 transition-colors">
                Refuser
              </button>
            </div>
            <div className="w-full border-t border-white/5 mt-2" />
          </div>
        )}

        {convo.messages.map((msg) => (
          <div key={msg.id} className={cn("flex items-end gap-2", msg.from === "me" ? "justify-end" : "justify-start")}>
            {msg.from === "them" && (
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
                {convo.fullName[0]}
              </div>
            )}
            <div className="max-w-xs flex flex-col" style={{ alignItems: msg.from === "me" ? "flex-end" : "flex-start" }}>
              {msg.type === "audio" ? (
                <div className={cn("flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl", msg.from === "me" ? "rounded-br-sm" : "rounded-bl-sm")}
                  style={{ background: msg.from === "me" ? "linear-gradient(135deg, #6d28d9, #ec4899)" : "#1a1a26" }}>
                  <button className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Play className="w-3 h-3 text-white fill-white" />
                  </button>
                  <div>
                    <p className="text-xs text-white font-semibold">{msg.audioName}</p>
                    <div className="flex items-end gap-0.5 mt-1">
                      {[...Array(18)].map((_, i) => (
                        <div key={i} className="w-0.5 bg-white/50 rounded-full" style={{ height: `${3 + Math.sin(i) * 6 + 4}px` }} />
                      ))}
                    </div>
                  </div>
                  <Mic className="w-3 h-3 text-white/40 ml-1" />
                </div>
              ) : (
                <div className={cn("px-4 py-2.5 rounded-2xl text-sm leading-relaxed", msg.from === "me" ? "rounded-br-sm text-white" : "rounded-bl-sm text-zinc-200")}
                  style={{ background: msg.from === "me" ? "linear-gradient(135deg, #6d28d9, #ec4899)" : "#1a1a26" }}>
                  {msg.content}
                </div>
              )}
              <span className="text-[10px] text-zinc-700 mt-0.5 px-1">
                {formatTime(msg.ts)}{msg.from === "me" && ` · ${msg.seen ? "Vu" : "Envoyé"}`}
              </span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies panel */}
      {showQuick && (
        <div className="px-4 py-2.5 border-t border-white/5 flex gap-2 overflow-x-auto flex-shrink-0" style={{ background: "#0d0d14" }}>
          <button onClick={() => setShowQuick(false)} className="flex-shrink-0 p-1 text-zinc-600 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
          {QUICK_REPLIES.map((r) => (
            <button key={r} onClick={() => { setText(r); setShowQuick(false); }}
              className="flex-shrink-0 text-xs text-zinc-300 px-3 py-1.5 rounded-full border border-white/10 hover:border-violet-500/50 hover:text-white transition-all whitespace-nowrap"
              style={{ background: "#13131a" }}>
              {r}
            </button>
          ))}
        </div>
      )}

      {/* Emoji picker */}
      {showEmoji && (
        <div className="px-4 py-3 border-t border-white/5 flex gap-2 flex-shrink-0" style={{ background: "#0d0d14" }}>
          {EMOJIS.map((e) => (
            <button key={e} onClick={() => { setText((p) => p + e); setShowEmoji(false); }}
              className="text-xl hover:scale-125 transition-transform">
              {e}
            </button>
          ))}
        </div>
      )}

      {/* Audio library */}
      {showAudio && (
        <div className="border-t border-white/5 flex-shrink-0" style={{ background: "#0d0d14" }}>
          <div className="px-4 pt-3 pb-1 flex items-center justify-between">
            <p className="text-xs font-bold text-white uppercase tracking-widest">Audios pré-enregistrés</p>
            <button onClick={() => setShowAudio(false)} className="text-zinc-600 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="px-3 pb-3 space-y-1.5">
            {AUDIO_LIBRARY.map((a) => (
              <button key={a.id} onClick={() => { onSend(`🎤 ${a.name} (${a.duration})`, "audio", a.name); setShowAudio(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all border border-white/5 hover:border-violet-500/30 text-left"
                style={{ background: "#13131a" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #7c3aed30, #ec489930)" }}>
                  <Play className="w-3.5 h-3.5 text-violet-400 fill-violet-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{a.name}</p>
                  <p className="text-xs text-zinc-500">{a.duration}</p>
                </div>
                <Send className="w-3.5 h-3.5 text-zinc-600" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="px-4 py-3 border-t border-white/5 flex-shrink-0" style={{ background: "#0a0a0f" }}>
        <div className="flex items-center gap-2">
          <button onClick={() => { setShowEmoji(!showEmoji); setShowAudio(false); setShowQuick(false); }}
            className={cn("p-2 rounded-full transition-colors", showEmoji ? "text-yellow-400" : "text-zinc-500 hover:text-white")}>
            <Smile className="w-5 h-5" />
          </button>
          <button onClick={() => { setShowAudio(!showAudio); setShowEmoji(false); setShowQuick(false); }}
            className={cn("p-2 rounded-full transition-colors", showAudio ? "text-violet-400" : "text-zinc-500 hover:text-white")}>
            <Mic className="w-5 h-5" />
          </button>
          <button className="p-2 text-zinc-500 hover:text-white rounded-full transition-colors">
            <Image className="w-5 h-5" />
          </button>

          <div className="flex-1 flex items-center gap-2 rounded-full px-4 py-2.5 border border-white/5 focus-within:border-violet-500/40 transition-colors"
            style={{ background: "#13131a" }}>
            <input value={text} onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Message..." className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none" />
            <button onClick={() => { setShowQuick(!showQuick); setShowEmoji(false); setShowAudio(false); }}
              className="text-zinc-600 hover:text-white transition-colors flex-shrink-0">
              <ChevronDown className={cn("w-4 h-4 transition-transform", showQuick && "rotate-180")} />
            </button>
          </div>

          {text.trim() ? (
            <button onClick={handleSend} className="p-2 rounded-full transition-all"
              style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
              <Send className="w-4 h-4 text-white" />
            </button>
          ) : (
            <button onClick={() => onSend("❤️")} className="p-2 text-zinc-500 hover:text-red-400 transition-colors">
              <Heart className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
