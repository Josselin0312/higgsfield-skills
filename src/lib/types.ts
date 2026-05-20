export type LeadStatus = "new" | "contacted" | "qualified" | "proposal" | "closed" | "lost";

export interface Lead {
  id: string;
  igUsername: string;
  igAvatar?: string;
  fullName?: string;
  status: LeadStatus;
  assignedTo?: string;
  notes: string;
  lastContact: string;
  createdAt: string;
  tags: string[];
}

export interface Setter {
  id: string;
  name: string;
  avatar?: string;
  role: "setter" | "closer" | "admin";
}

export interface GeneratedContent {
  id: string;
  skillId: string;
  skillName: string;
  inputs: Record<string, string>;
  output: string;
  createdAt: string;
  posted: boolean;
}

export interface Post {
  id: string;
  content: string;
  imageUrl?: string;
  scheduledAt?: string;
  postedAt?: string;
  status: "draft" | "scheduled" | "posted";
  igAccountId?: string;
}
