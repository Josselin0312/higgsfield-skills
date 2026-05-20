"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Heart, Image, Smile, Mic, MoreHorizontal, Trash2, ChevronDown, Play, Star, Info, X, Pencil, ArrowRight, Check } from "lucide-react";
import { type Conversation, AUDIO_LIBRARY } from "@/lib/crmData";
import { cn } from "@/lib/utils";

const EMOJIS = ["❤️", "😂", "🔥", "👏", "😮", "🙏", "💯", "😍"];
const REACTION_EMOJIS = ["❤️", "🔥", "😂", "👏", "😮", "🙏"];
const QUICK_REPLIES = [
  "Salut ! T'as vu mon dernier post ?",
  "C'est quoi ta situation actuelle ?",
  "Ok je comprends. T'as déjà essayé de… ?",
  "Je t'envoie les infos 👇",
  "On peut faire un point rapide ?",
  "C'est exactement ce qu'on règle ici 🔥",
];

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #ff2d78, #ff8c00)",
  "linear-gradient(135deg, #bf00ff, #ff2d78)",
  "linear-gradient(135deg, #00e5ff, #bf00ff)",
  "linear-gradient(135deg, #ffd700, #ff2d78)",
  "linear-gradient(135deg, #00ff88, #00e5ff)",
];
function avatarGradient(name: string) {
  const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

interface Props {
  convo: Conversation;
  onSend: (content: string, type?: "text" | "audio", audioName?: string) => void;
  onQualify: () => void;
  onDelete: () => void;
  onEditMessage: (msgId: string, content: string) => void;
  onDeleteMessage: (msgId: string) => void;
  onReact: (msgId: string, emoji: string) => void;
  onTransfer: (status: "new" | "qualified") => void;
}

export default function ChatView({ convo, onSend, onQualify, onDelete, onEditMessage, onDeleteMessage, onReact, onTransfer }: Props) {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  const [showQuick, setShowQuick] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [editingMsg, setEditingMsg] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [reactionPicker, setReactionPicker] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [convo.messages]);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
    setShowQuick(false);
  };

  const saveEdit = () => {
    if (editingMsg && editText.trim()) onEditMessage(editingMsg, editText.trim());
    setEditingMsg(null);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
        style={{ background: "#0a0618", borderBottom: "1px solid rgba(255,215,0,0.15)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white"
            style={{ background: avatarGradient(convo.fullName), border: "2px solid rgba(255,215,0,0.4)", boxShadow: "0 0 12px rgba(255,215,0,0.2)" }}>
            {convo.fullName[0]}
          </div>
          <div>
            <p className="text-sm font-black text-white">{convo.fullName}</p>
            <p className="text-xs" style={{ color: "rgba(255,215,0,0.5)" }}>@{convo.igUsername}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {convo.status !== "qualified" ? (
            <button onClick={onQualify}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all"
              style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.3)", color: "#ffd700" }}>
              <Star className="w-3 h-3" /> Qualifier
            </button>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
              style={{ background: "rgba(255,215,0,0.15)", border: "1px solid rgba(255,215,0,0.4)", color: "#ffd700" }}>
              <Star className="w-3 h-3 fill-yellow-400" /> Qualifié
            </span>
          )}

          <div className="relative">
            <button onClick={() => { setShowTransfer(!showTransfer); setShowMenu(false); }}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all"
              style={{ background: "rgba(191,0,255,0.08)", border: "1px solid rgba(191,0,255,0.3)", color: "#bf80ff" }}>
              <ArrowRight className="w-3 h-3" /> Transférer
            </button>
            {showTransfer && (
              <div className="absolute right-0 top-full mt-1 rounded-xl overflow-hidden shadow-2xl z-20 w-40"
                style={{ background: "#150d2a", border: "1px solid rgba(255,215,0,0.3)" }}>
                <button onClick={() => { onTransfer("new"); setShowTransfer(false); }}
                  className="w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-white/5 transition-colors"
                  style={{ color: "rgba(255,215,0,0.8)" }}>✦ Nouveau</button>
                <button onClick={() => { onTransfer("qualified"); setShowTransfer(false); }}
                  className="w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-white/5 transition-colors"
                  style={{ color: "#ffd700" }}>♛ Qualifier</button>
              </div>
            )}
          </div>

          <div className="relative">
            <button onClick={() => { setShowMenu(!showMenu); setShowTransfer(false); }}
              className="p-2 rounded-lg transition-colors"
              style={{ color: "rgba(255,215,0,0.4)" }}>
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 rounded-xl shadow-2xl overflow-hidden z-20 w-44"
                style={{ background: "#150d2a", border: "1px solid rgba(255,215,0,0.2)" }}>
                <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors text-left"
                  style={{ color: "rgba(255,215,0,0.6)" }}>
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
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(124,0,255,0.05) 0%, #07050e 55%)" }}>

        {convo.isRequest && (
          <div className="flex flex-col items-center py-6 gap-3">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black text-white"
              style={{ background: avatarGradient(convo.fullName), border: "3px solid rgba(255,215,0,0.4)", boxShadow: "0 0 20px rgba(255,215,0,0.2)" }}>
              {convo.fullName[0]}
            </div>
            <p className="text-white font-black">{convo.fullName}</p>
            <p className="text-xs" style={{ color: "rgba(255,215,0,0.5)" }}>t'a envoyé une demande de message</p>
            <div className="flex gap-2">
              <button className="px-5 py-2 text-sm font-black rounded-xl text-black"
                style={{ background: "linear-gradient(135deg, #ffd700, #ff8c00)", boxShadow: "0 0 15px rgba(255,215,0,0.4)" }}>
                Accepter
              </button>
              <button className="px-5 py-2 text-sm font-bold rounded-xl text-zinc-400"
                style={{ border: "1px solid rgba(255,215,0,0.2)" }}>
                Refuser
              </button>
            </div>
            <div className="w-full mt-2" style={{ borderTop: "1px solid rgba(255,215,0,0.08)" }} />
          </div>
        )}

        {convo.messages.map((msg) => {
          const isMe = msg.from === "me";
          const isEditing = editingMsg === msg.id;
          const showReactionPicker = reactionPicker === msg.id;

          return (
            <div key={msg.id} className={cn("flex items-end gap-2 group/msg", isMe ? "justify-end" : "justify-start")}>

              {/* Avatar for "them" */}
              {!isMe && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black text-white flex-shrink-0 self-end"
                  style={{ background: avatarGradient(convo.fullName), border: "1.5px solid rgba(255,215,0,0.3)" }}>
                  {convo.fullName[0]}
                </div>
              )}

              {/* Actions — left of bubble for my messages */}
              {isMe && !isEditing && (
                <div className="flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 transition-all self-end pb-5">
                  <button onClick={() => setReactionPicker(showReactionPicker ? null : msg.id)}
                    style={{ color: "rgba(255,215,0,0.5)" }} title="Réagir">
                    <Smile className="w-3.5 h-3.5" />
                  </button>
                  {!msg.deleted && (
                    <>
                      <button onClick={() => { setEditingMsg(msg.id); setEditText(msg.content); }}
                        className="hover:text-blue-400 transition-colors" style={{ color: "rgba(255,215,0,0.4)" }} title="Modifier">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => onDeleteMessage(msg.id)}
                        className="hover:text-red-400 transition-colors" style={{ color: "rgba(255,45,120,0.4)" }} title="Supprimer">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Bubble column */}
              <div className="max-w-[260px] flex flex-col" style={{ alignItems: isMe ? "flex-end" : "flex-start" }}>

                {/* Reaction picker inline above bubble */}
                {showReactionPicker && (
                  <div className="flex gap-1.5 p-2 mb-1 rounded-2xl"
                    style={{ background: "#1a0d30", border: "1px solid rgba(255,215,0,0.3)", boxShadow: "0 0 20px rgba(255,215,0,0.1)" }}>
                    {REACTION_EMOJIS.map((e) => (
                      <button key={e} onClick={() => { onReact(msg.id, e); setReactionPicker(null); }}
                        className="text-xl hover:scale-125 transition-transform">{e}</button>
                    ))}
                  </div>
                )}

                {/* Bubble */}
                {isEditing ? (
                  <div className="p-3 rounded-2xl w-56"
                    style={{ background: "#1a0d30", border: "1px solid rgba(255,215,0,0.3)" }}>
                    <textarea value={editText} onChange={(e) => setEditText(e.target.value)}
                      className="w-full bg-transparent text-sm text-white focus:outline-none resize-none"
                      rows={2} autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEdit(); }
                        if (e.key === "Escape") setEditingMsg(null);
                      }} />
                    <div className="flex gap-2 justify-end mt-1">
                      <button onClick={() => setEditingMsg(null)} className="text-xs text-zinc-500 hover:text-white transition-colors">Annuler</button>
                      <button onClick={saveEdit} className="text-xs font-black transition-colors flex items-center gap-1" style={{ color: "#ffd700" }}>
                        <Check className="w-3 h-3" /> Sauver
                      </button>
                    </div>
                  </div>
                ) : msg.deleted ? (
                  <div className="px-4 py-2.5 rounded-2xl text-sm italic"
                    style={{ color: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    Message supprimé
                  </div>
                ) : msg.type === "audio" ? (
                  <div className={cn("flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl", isMe ? "rounded-br-sm" : "rounded-bl-sm")}
                    style={isMe ? {
                      background: "linear-gradient(135deg, #7c00ff, #ff2d78)",
                      boxShadow: "0 0 20px rgba(255,45,120,0.3)",
                    } : {
                      background: "#140e28",
                      border: "1px solid rgba(255,215,0,0.12)",
                    }}>
                    <button className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <Play className="w-3 h-3 text-white fill-white" />
                    </button>
                    <div>
                      <p className="text-xs text-white font-bold">{msg.audioName}</p>
                      <div className="flex items-end gap-0.5 mt-1">
                        {[...Array(18)].map((_, i) => (
                          <div key={i} className="w-0.5 rounded-full"
                            style={{ height: `${3 + Math.sin(i) * 5 + 4}px`, background: isMe ? "rgba(255,255,255,0.6)" : "rgba(255,215,0,0.4)" }} />
                        ))}
                      </div>
                    </div>
                    <Mic className="w-3 h-3 text-white/40 ml-1" />
                  </div>
                ) : (
                  <div
                    onDoubleClick={() => !msg.deleted && onReact(msg.id, "❤️")}
                    className={cn("px-4 py-2.5 rounded-2xl text-sm leading-relaxed", isMe ? "rounded-br-sm text-white" : "rounded-bl-sm text-zinc-100")}
                    style={isMe ? {
                      background: "linear-gradient(135deg, #7c00ff, #ff2d78)",
                      boxShadow: "0 0 20px rgba(255,45,120,0.25)",
                      cursor: "default",
                    } : {
                      background: "#140e28",
                      border: "1px solid rgba(255,215,0,0.1)",
                      cursor: "default",
                    }}>
                    {msg.content}
                  </div>
                )}

                {/* Reactions badges */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className={cn("flex gap-1 mt-1 flex-wrap", isMe ? "justify-end" : "justify-start")}>
                    {msg.reactions.map((r, i) => (
                      <button key={i} onClick={() => onReact(msg.id, r.emoji)}
                        className="text-xs px-2 py-0.5 rounded-full font-bold transition-all"
                        style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.3)", color: "#ffd700", boxShadow: "0 0 6px rgba(255,215,0,0.15)" }}>
                        {r.emoji}
                      </button>
                    ))}
                  </div>
                )}

                <span className="text-[10px] mt-0.5 px-1" style={{ color: "rgba(255,215,0,0.22)" }}>
                  {formatTime(msg.ts)}{isMe && ` · ${msg.seen ? "Vu" : "Envoyé"}`}{msg.edited && " · Modifié"}
                </span>
              </div>

              {/* Actions — right of bubble for "them" messages */}
              {!isMe && !isEditing && (
                <div className="flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 transition-all self-end pb-5">
                  <button onClick={() => setReactionPicker(showReactionPicker ? null : msg.id)}
                    style={{ color: "rgba(255,215,0,0.5)" }} title="Réagir">
                    <Smile className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      {showQuick && (
        <div className="px-4 py-2.5 flex gap-2 overflow-x-auto flex-shrink-0"
          style={{ background: "#0a0618", borderTop: "1px solid rgba(255,215,0,0.1)" }}>
          <button onClick={() => setShowQuick(false)} style={{ color: "rgba(255,215,0,0.4)" }} className="flex-shrink-0 p-1">
            <X className="w-3.5 h-3.5" />
          </button>
          {QUICK_REPLIES.map((r) => (
            <button key={r} onClick={() => { setText(r); setShowQuick(false); }}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full whitespace-nowrap font-semibold transition-all"
              style={{ background: "#150d2a", border: "1px solid rgba(255,215,0,0.15)", color: "rgba(255,215,0,0.8)" }}>
              {r}
            </button>
          ))}
        </div>
      )}

      {/* Emoji picker */}
      {showEmoji && (
        <div className="px-4 py-3 flex gap-2 flex-shrink-0"
          style={{ background: "#0a0618", borderTop: "1px solid rgba(255,215,0,0.1)" }}>
          {EMOJIS.map((e) => (
            <button key={e} onClick={() => { setText((p) => p + e); setShowEmoji(false); }}
              className="text-xl hover:scale-125 transition-transform">{e}</button>
          ))}
        </div>
      )}

      {/* Audio library */}
      {showAudio && (
        <div className="flex-shrink-0" style={{ background: "#0a0618", borderTop: "1px solid rgba(255,215,0,0.1)" }}>
          <div className="px-4 pt-3 pb-1 flex items-center justify-between">
            <p className="text-xs font-black tracking-widest" style={{ color: "#ffd700" }}>♪ AUDIOS PRÉ-ENREGISTRÉS</p>
            <button onClick={() => setShowAudio(false)} style={{ color: "rgba(255,215,0,0.4)" }}><X className="w-3.5 h-3.5" /></button>
          </div>
          <div className="px-3 pb-3 space-y-1.5">
            {AUDIO_LIBRARY.map((a) => (
              <button key={a.id} onClick={() => { onSend(`🎤 ${a.name} (${a.duration})`, "audio", a.name); setShowAudio(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
                style={{ background: "#150d2a", border: "1px solid rgba(255,215,0,0.1)" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(124,0,255,0.2)" }}>
                  <Play className="w-3.5 h-3.5" style={{ color: "#bf80ff", fill: "#bf80ff" }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">{a.name}</p>
                  <p className="text-xs" style={{ color: "rgba(255,215,0,0.4)" }}>{a.duration}</p>
                </div>
                <Send className="w-3.5 h-3.5" style={{ color: "rgba(255,215,0,0.3)" }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="px-4 py-3 flex-shrink-0" style={{ background: "#0a0618", borderTop: "1px solid rgba(255,215,0,0.12)" }}>
        <div className="flex items-center gap-2">
          <button onClick={() => { setShowEmoji(!showEmoji); setShowAudio(false); setShowQuick(false); }}
            style={{ color: showEmoji ? "#ffd700" : "rgba(255,215,0,0.35)" }}>
            <Smile className="w-5 h-5" />
          </button>
          <button onClick={() => { setShowAudio(!showAudio); setShowEmoji(false); setShowQuick(false); }}
            style={{ color: showAudio ? "#bf80ff" : "rgba(255,215,0,0.35)" }}>
            <Mic className="w-5 h-5" />
          </button>
          <button style={{ color: "rgba(255,215,0,0.35)" }}>
            <Image className="w-5 h-5" />
          </button>

          <div className="flex-1 flex items-center gap-2 rounded-full px-4 py-2.5 transition-colors"
            style={{ background: "#150d2a", border: "1px solid rgba(255,215,0,0.15)" }}>
            <input value={text} onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Message..." className="flex-1 bg-transparent text-sm text-white placeholder-zinc-700 focus:outline-none" />
            <button onClick={() => { setShowQuick(!showQuick); setShowEmoji(false); setShowAudio(false); }}
              className="flex-shrink-0 transition-colors" style={{ color: "rgba(255,215,0,0.35)" }}>
              <ChevronDown className={cn("w-4 h-4 transition-transform", showQuick && "rotate-180")} />
            </button>
          </div>

          {text.trim() ? (
            <button onClick={handleSend} className="p-2.5 rounded-full transition-all"
              style={{ background: "linear-gradient(135deg, #7c00ff, #ff2d78)", boxShadow: "0 0 15px rgba(255,45,120,0.4)" }}>
              <Send className="w-4 h-4 text-white" />
            </button>
          ) : (
            <button onClick={() => onSend("❤️")} style={{ color: "rgba(255,45,120,0.6)" }}>
              <Heart className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
