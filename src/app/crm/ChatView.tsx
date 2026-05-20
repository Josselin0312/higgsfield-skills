"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Heart, Image, Smile, Mic, MoreHorizontal, Trash2, ChevronDown, Play, Star, Info } from "lucide-react";
import { type Conversation } from "@/lib/crmData";
import { AUDIO_LIBRARY } from "@/lib/crmData";
import { cn } from "@/lib/utils";

const EMOJIS = ["❤️", "😂", "🔥", "👏", "😮", "😢", "😡", "👍"];
const QUICK_REPLIES = [
  "Salut ! T'as vu mon dernier post ?",
  "C'est quoi exactement ta situation actuelle ?",
  "Ok je comprends. T'as déjà essayé de... ?",
  "Je t'envoie les infos sur ce lien 👇",
  "On peut faire un point rapide si tu veux ?",
];

interface Props {
  convo: Conversation;
  onSend: (content: string, type?: "text" | "audio", audioName?: string) => void;
  onQualify: () => void;
  onDelete: () => void;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatView({ convo, onSend, onQualify, onDelete }: Props) {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  const [showQuick, setShowQuick] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [convo.messages]);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  const sendAudio = (audio: typeof AUDIO_LIBRARY[0]) => {
    onSend(`🎤 ${audio.name} (${audio.duration})`, "audio", audio.name);
    setShowAudio(false);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-950 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-sm font-bold text-white">
            {convo.fullName[0]}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{convo.fullName}</p>
            <p className="text-xs text-zinc-500">@{convo.igUsername}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {convo.status !== "qualified" && (
            <button
              onClick={onQualify}
              className="flex items-center gap-1.5 text-xs font-medium text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-full hover:bg-yellow-500/20 transition-colors"
            >
              <Star className="w-3 h-3" /> Qualifier
            </button>
          )}
          {convo.status === "qualified" && (
            <span className="text-xs font-medium text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400" /> Qualifié
            </span>
          )}

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-800"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl overflow-hidden z-20 w-44">
                <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors text-left">
                  <Info className="w-3.5 h-3.5" /> Infos du lead
                </button>
                <button
                  onClick={() => { onDelete(); setShowMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-zinc-700 transition-colors text-left"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Supprimer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-zinc-950">
        {convo.isRequest && (
          <div className="flex flex-col items-center py-4 gap-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-xl font-bold text-white">
              {convo.fullName[0]}
            </div>
            <p className="text-white font-semibold">{convo.fullName}</p>
            <p className="text-zinc-500 text-sm text-center">t'a envoyé une demande de message</p>
            <div className="flex gap-2">
              <button className="px-5 py-2 bg-blue-500 text-white text-sm font-semibold rounded-xl hover:bg-blue-400 transition-colors">
                Accepter
              </button>
              <button className="px-5 py-2 bg-zinc-800 text-zinc-300 text-sm font-semibold rounded-xl hover:bg-zinc-700 transition-colors">
                Refuser
              </button>
            </div>
            <div className="w-full border-t border-zinc-800 mt-2" />
          </div>
        )}

        {convo.messages.map((msg) => (
          <div key={msg.id} className={cn("flex", msg.from === "me" ? "justify-end" : "justify-start")}>
            {msg.from === "them" && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-xs font-bold text-white mr-2 flex-shrink-0 self-end">
                {convo.fullName[0]}
              </div>
            )}
            <div className={cn("max-w-xs group", msg.from === "me" ? "items-end" : "items-start", "flex flex-col")}>
              {msg.type === "audio" ? (
                <div className={cn(
                  "flex items-center gap-2.5 px-4 py-3 rounded-2xl",
                  msg.from === "me" ? "bg-blue-500 rounded-br-sm" : "bg-zinc-800 rounded-bl-sm"
                )}>
                  <button className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                    <Play className="w-3 h-3 text-white fill-white" />
                  </button>
                  <div>
                    <p className="text-xs text-white font-medium">{msg.audioName}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(20)].map((_, i) => (
                        <div key={i} className="w-0.5 bg-white/60 rounded-full" style={{ height: `${4 + Math.random() * 10}px` }} />
                      ))}
                    </div>
                  </div>
                  <Mic className="w-3.5 h-3.5 text-white/60 ml-1" />
                </div>
              ) : (
                <div className={cn(
                  "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                  msg.from === "me"
                    ? "bg-blue-500 text-white rounded-br-sm"
                    : "bg-zinc-800 text-white rounded-bl-sm"
                )}>
                  {msg.content}
                </div>
              )}
              <div className="flex items-center gap-1 mt-0.5 px-1">
                <span className="text-[10px] text-zinc-600">{formatTime(msg.ts)}</span>
                {msg.from === "me" && (
                  <span className="text-[10px] text-zinc-600">{msg.seen ? "Vu" : "Envoyé"}</span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      {showQuick && (
        <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-900 flex gap-2 overflow-x-auto">
          {QUICK_REPLIES.map((r) => (
            <button
              key={r}
              onClick={() => { setText(r); setShowQuick(false); }}
              className="flex-shrink-0 text-xs bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-full hover:bg-zinc-700 hover:text-white transition-colors border border-zinc-700"
            >
              {r}
            </button>
          ))}
        </div>
      )}

      {/* Emoji picker */}
      {showEmoji && (
        <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-900 flex gap-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => { setText((p) => p + e); setShowEmoji(false); }}
              className="text-xl hover:scale-125 transition-transform"
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {/* Audio library */}
      {showAudio && (
        <div className="border-t border-zinc-800 bg-zinc-900 px-4 py-3">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Audios pré-enregistrés</p>
          <div className="space-y-1.5">
            {AUDIO_LIBRARY.map((a) => (
              <button
                key={a.id}
                onClick={() => sendAudio(a)}
                className="w-full flex items-center gap-3 px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Play className="w-3.5 h-3.5 text-blue-400 fill-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{a.name}</p>
                  <p className="text-xs text-zinc-500">{a.duration}</p>
                </div>
                <Send className="w-3.5 h-3.5 text-zinc-500" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-950 flex-shrink-0">
        <div className="flex items-center gap-2">
          {/* Left icons */}
          <button onClick={() => { setShowEmoji(!showEmoji); setShowAudio(false); setShowQuick(false); }} className={cn("p-2 rounded-full transition-colors", showEmoji ? "text-white bg-zinc-700" : "text-zinc-400 hover:text-white")}>
            <Smile className="w-5 h-5" />
          </button>
          <button onClick={() => { setShowAudio(!showAudio); setShowEmoji(false); setShowQuick(false); }} className={cn("p-2 rounded-full transition-colors", showAudio ? "text-white bg-zinc-700" : "text-zinc-400 hover:text-white")} title="Audios pré-enregistrés">
            <Mic className="w-5 h-5" />
          </button>
          <button className="p-2 text-zinc-400 hover:text-white rounded-full transition-colors">
            <Image className="w-5 h-5" />
          </button>

          {/* Text input */}
          <div className="flex-1 relative">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Message..."
              className="w-full bg-zinc-800 rounded-full px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none pr-10"
            />
            <button
              onClick={() => { setShowQuick(!showQuick); setShowEmoji(false); setShowAudio(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Send or heart */}
          {text.trim() ? (
            <button onClick={handleSend} className="p-2 text-blue-400 hover:text-blue-300 transition-colors">
              <Send className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={() => onSend("❤️")} className="p-2 text-zinc-400 hover:text-red-400 transition-colors">
              <Heart className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
