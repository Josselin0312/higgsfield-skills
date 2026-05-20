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

  const sendMessage = (id: string, content: string, type: "text" | "audio" = "text", audioName?: string) => {
    setConvos((prev) => prev.map((c) => {
      if (c.id !== id) return c;
      const msg = { id: `m${Date.now()}`, from: "me" as const, type, content, audioName, seen: false, ts: new Date().toISOString() };
      return { ...c, messages: [...c.messages, msg], lastMessage: audioName ?? content, lastTs: msg.ts };
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
      <div className="w-72 flex-shrink-0 border-r border-white/5 flex flex-col overflow-hidden" style={{ background: "#0a0a0f" }}>
        <ConversationList
          convos={filtered} filter={filter} counts={counts} search={search} selectedId={selectedId}
          onFilter={setFilter} onSearch={setSearch} onSelect={setSelectedId}
          onDelete={deleteConvo} onAccept={acceptRequest}
        />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#060608" }}>
        {selected ? (
          <ChatView convo={selected}
            onSend={(content, type, audioName) => sendMessage(selected.id, content, type, audioName)}
            onQualify={() => setQualified(selected.id)}
            onDelete={() => deleteConvo(selected.id)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #a855f720, #ec489920)" }}>
              <span className="text-3xl">💬</span>
            </div>
            <p className="text-zinc-600 text-sm">Sélectionne une conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}
