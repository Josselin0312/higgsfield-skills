"use client";

import { useState } from "react";
import { MOCK_CONVERSATIONS, type Conversation } from "@/lib/crmData";
import ConversationList from "./ConversationList";
import ChatView from "./ChatView";

export type CRMFilter = "tous" | "nouveau" | "qualifie" | "requests";

export default function CRMPage() {
  const [convos, setConvos] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [filter, setFilter] = useState<CRMFilter>("tous");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const selected = convos.find((c) => c.id === selectedId) ?? null;

  const deleteConvo = (id: string) => {
    setConvos((prev) => prev.filter((c) => c.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const acceptRequest = (id: string) => {
    setConvos((prev) => prev.map((c) => c.id === id ? { ...c, isRequest: false, status: "new" as const } : c));
  };

  const setQualified = (id: string) => {
    setConvos((prev) => prev.map((c) => c.id === id ? { ...c, status: "qualified" as const } : c));
  };

  const transferConvo = (convoId: string, status: "new" | "qualified") => {
    setConvos((prev) => prev.map((c) => c.id !== convoId ? c : { ...c, status, isNew: status === "new" }));
  };

  const sendMessage = (id: string, content: string, type: "text" | "audio" = "text", audioName?: string) => {
    setConvos((prev) => prev.map((c) => {
      if (c.id !== id) return c;
      const msg = { id: `m${Date.now()}`, from: "me" as const, type, content, audioName, seen: false, ts: new Date().toISOString() };
      return { ...c, messages: [...c.messages, msg], lastMessage: audioName ?? content, lastTs: msg.ts };
    }));
  };

  const editMessage = (convoId: string, msgId: string, content: string) => {
    setConvos((prev) => prev.map((c) => c.id !== convoId ? c : {
      ...c,
      messages: c.messages.map((m) => m.id !== msgId ? m : { ...m, content, edited: true }),
    }));
  };

  const deleteMessage = (convoId: string, msgId: string) => {
    setConvos((prev) => prev.map((c) => c.id !== convoId ? c : {
      ...c,
      messages: c.messages.map((m) => m.id !== msgId ? m : { ...m, deleted: true }),
    }));
  };

  const addReaction = (convoId: string, msgId: string, emoji: string) => {
    setConvos((prev) => prev.map((c) => c.id !== convoId ? c : {
      ...c,
      messages: c.messages.map((m) => {
        if (m.id !== msgId) return m;
        const reactions = m.reactions ?? [];
        const hasIt = reactions.find((r) => r.from === "me" && r.emoji === emoji);
        return {
          ...m,
          reactions: hasIt
            ? reactions.filter((r) => !(r.from === "me" && r.emoji === emoji))
            : [...reactions.filter((r) => r.from !== "me"), { emoji, from: "me" as const }],
        };
      }),
    }));
  };

  const counts = {
    tous: convos.filter((c) => !c.isRequest).length,
    nouveau: convos.filter((c) => !c.isRequest && c.isNew).length,
    qualifie: convos.filter((c) => !c.isRequest && c.status === "qualified").length,
    requests: convos.filter((c) => c.isRequest).length,
  };

  const filtered = convos.filter((c) => {
    if (filter === "requests") return c.isRequest;
    if (c.isRequest) return false;
    const matchSearch = !search || c.igUsername.includes(search.toLowerCase()) || c.fullName.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filter === "nouveau") return c.isNew;
    if (filter === "qualifie") return c.status === "qualified";
    return true;
  });

  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-80 flex-shrink-0 border-r flex flex-col overflow-hidden" style={{ background: "#07050e", borderColor: "rgba(255,215,0,0.1)" }}>
        <ConversationList
          convos={filtered} filter={filter} counts={counts} search={search} selectedId={selectedId}
          onFilter={setFilter} onSearch={setSearch} onSelect={setSelectedId}
          onDelete={deleteConvo} onAccept={acceptRequest}
          onTransfer={transferConvo}
        />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#07050e" }}>
        {selected ? (
          <ChatView convo={selected}
            onSend={(content, type, audioName) => sendMessage(selected.id, content, type, audioName)}
            onQualify={() => setQualified(selected.id)}
            onDelete={() => deleteConvo(selected.id)}
            onEditMessage={(msgId, content) => editMessage(selected.id, msgId, content)}
            onDeleteMessage={(msgId) => deleteMessage(selected.id, msgId)}
            onReact={(msgId, emoji) => addReaction(selected.id, msgId, emoji)}
            onTransfer={(status) => transferConvo(selected.id, status)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="text-5xl" style={{ filter: "drop-shadow(0 0 20px #ffd700)" }}>♠</div>
            <p className="text-sm font-bold" style={{ color: "rgba(255,215,0,0.4)" }}>Sélectionne une conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}
