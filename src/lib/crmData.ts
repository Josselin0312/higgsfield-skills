import { type LeadStatus } from "./types";

export interface Message {
  id: string;
  from: "me" | "them";
  type: "text" | "image" | "audio" | "reaction" | "story_reply";
  content: string;
  audioName?: string;
  reaction?: string;
  seen: boolean;
  ts: string;
}

export interface Conversation {
  id: string;
  igUsername: string;
  fullName: string;
  avatar?: string;
  status: LeadStatus;
  isRequest: boolean;
  isNew: boolean;
  lastMessage: string;
  lastTs: string;
  unread: number;
  messages: Message[];
  tags: string[];
  assignedTo?: string;
  notes: string;
}

export const AUDIO_LIBRARY = [
  { id: "a1", name: "Intro bienvenue", duration: "0:12", url: "" },
  { id: "a2", name: "Suivi après Reel", duration: "0:18", url: "" },
  { id: "a3", name: "Présentation offre", duration: "0:45", url: "" },
  { id: "a4", name: "Follow-up 3 jours", duration: "0:22", url: "" },
  { id: "a5", name: "Closing objection prix", duration: "1:02", url: "" },
];

const now = Date.now();
const h = (n: number) => new Date(now - n * 3600000).toISOString();
const m = (n: number) => new Date(now - n * 60000).toISOString();

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "1", igUsername: "thomas.entrepreneur", fullName: "Thomas M.",
    status: "qualified", isRequest: false, isNew: true,
    lastMessage: "Ouais ça m'intéresse vraiment", lastTs: m(12), unread: 2,
    tags: ["chaud"], assignedTo: "Sophie", notes: "Intéressé par la formation",
    messages: [
      { id: "m1", from: "them", type: "text", content: "Salut j'ai vu ton reel sur les 10k€", seen: true, ts: h(5) },
      { id: "m2", from: "me", type: "text", content: "Hey ! Oui c'est exactement ce qu'on fait ici 🔥 T'es dans quelle situation actuellement ?", seen: true, ts: h(4) },
      { id: "m3", from: "them", type: "text", content: "Je suis freelance depuis 6 mois, je galère à trouver des clients", seen: true, ts: h(3) },
      { id: "m4", from: "me", type: "text", content: "Ok je vois le tableau. T'as une offre claire ou tu proposes tout ?", seen: true, ts: h(2) },
      { id: "m5", from: "them", type: "text", content: "Un peu de tout en ce moment...", seen: true, ts: h(1) },
      { id: "m6", from: "them", type: "text", content: "Ouais ça m'intéresse vraiment", seen: false, ts: m(12) },
    ],
  },
  {
    id: "2", igUsername: "marie_freelance", fullName: "Marie L.",
    status: "new", isRequest: false, isNew: true,
    lastMessage: "Ok je regarde ça 👀", lastTs: m(45), unread: 1,
    tags: [], assignedTo: "Lucas", notes: "",
    messages: [
      { id: "m1", from: "me", type: "text", content: "Hey Marie ! J'ai vu que tu avais commenté 'intéressée' sur mon post — c'est quoi exactement ce que tu cherches ?", seen: true, ts: h(3) },
      { id: "m2", from: "them", type: "text", content: "Oui j'aimerai scaler mon activité", seen: true, ts: h(2) },
      { id: "m3", from: "me", type: "text", content: "Cool ! Envoie moi les infos sur ce lien 👇", seen: true, ts: h(1) },
      { id: "m4", from: "them", type: "text", content: "Ok je regarde ça 👀", seen: false, ts: m(45) },
    ],
  },
  {
    id: "3", igUsername: "kevin.biz", fullName: "Kevin R.",
    status: "new", isRequest: true, isNew: true,
    lastMessage: "Bonjour je voudrais en savoir plus", lastTs: m(30), unread: 1,
    tags: [], assignedTo: undefined, notes: "",
    messages: [
      { id: "m1", from: "them", type: "text", content: "Bonjour je voudrais en savoir plus", seen: false, ts: m(30) },
    ],
  },
  {
    id: "4", igUsername: "sophie_coach", fullName: "Sophie T.",
    status: "new", isRequest: true, isNew: true,
    lastMessage: "Votre contenu est top, j'ai une question", lastTs: h(1), unread: 1,
    tags: [], assignedTo: undefined, notes: "",
    messages: [
      { id: "m1", from: "them", type: "text", content: "Votre contenu est top, j'ai une question", seen: false, ts: h(1) },
    ],
  },
  {
    id: "5", igUsername: "alex.marketing", fullName: "Alex D.",
    status: "qualified", isRequest: false, isNew: false,
    lastMessage: "Je reviens vers toi demain", lastTs: h(26), unread: 0,
    tags: ["chaud"], assignedTo: "Sophie", notes: "A visité la page de vente",
    messages: [
      { id: "m1", from: "them", type: "text", content: "Je reviens vers toi demain", seen: true, ts: h(26) },
    ],
  },
];
