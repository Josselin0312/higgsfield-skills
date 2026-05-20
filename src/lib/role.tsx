"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type Role = "admin" | "setter";

interface User {
  name: string;
  role: Role;
}

const USERS: User[] = [
  { name: "Admin", role: "admin" },
  { name: "Sophie", role: "setter" },
  { name: "Lucas", role: "setter" },
];

interface RoleContextType {
  user: User;
  setUser: (u: User) => void;
  isAdmin: boolean;
  users: User[];
}

const RoleContext = createContext<RoleContextType | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(USERS[0]);
  return (
    <RoleContext.Provider value={{ user, setUser, isAdmin: user.role === "admin", users: USERS }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
