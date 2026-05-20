"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export interface IGAccount {
  id: string;
  username: string;
  password: string;
  avatar?: string;
  connected: boolean;
  addedAt: string;
}

interface AccountContextType {
  accounts: IGAccount[];
  activeAccount: IGAccount | null;
  addAccount: (username: string, password: string) => void;
  removeAccount: (id: string) => void;
  selectAccount: (account: IGAccount) => void;
  logout: () => void;
}

const AccountContext = createContext<AccountContextType | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<IGAccount[]>([
    { id: "1", username: "moncompte_ig", password: "••••••••", avatar: "", connected: true, addedAt: "2026-05-20" },
  ]);
  const [activeAccount, setActiveAccount] = useState<IGAccount | null>(null);

  const addAccount = (username: string, password: string) => {
    const newAccount: IGAccount = {
      id: Date.now().toString(),
      username,
      password,
      connected: true,
      addedAt: new Date().toISOString().split("T")[0],
    };
    setAccounts((prev) => [...prev, newAccount]);
  };

  const removeAccount = (id: string) => setAccounts((prev) => prev.filter((a) => a.id !== id));
  const selectAccount = (account: IGAccount) => setActiveAccount(account);
  const logout = () => setActiveAccount(null);

  return (
    <AccountContext.Provider value={{ accounts, activeAccount, addAccount, removeAccount, selectAccount, logout }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used within AccountProvider");
  return ctx;
}
