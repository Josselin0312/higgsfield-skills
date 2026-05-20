"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export interface IGAccount {
  id: string;
  username: string;
  password: string;
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

const STORAGE_KEY = "igflow_accounts";
const ACTIVE_KEY = "igflow_active";

export function AccountProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<IGAccount[]>([]);
  const [activeAccount, setActiveAccount] = useState<IGAccount | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const savedActive = localStorage.getItem(ACTIVE_KEY);
      if (saved) setAccounts(JSON.parse(saved));
      else setAccounts([{ id: "1", username: "moncompte_ig", password: "", connected: true, addedAt: "2026-05-20" }]);
      if (savedActive) setActiveAccount(JSON.parse(savedActive));
    } catch {}
    setReady(true);
  }, []);

  const persist = (list: IGAccount[]) => {
    setAccounts(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const addAccount = (username: string, password: string) => {
    const a: IGAccount = { id: Date.now().toString(), username, password, connected: true, addedAt: new Date().toISOString().split("T")[0] };
    persist([...accounts, a]);
  };

  const removeAccount = (id: string) => {
    persist(accounts.filter((a) => a.id !== id));
    if (activeAccount?.id === id) logout();
  };

  const selectAccount = (account: IGAccount) => {
    setActiveAccount(account);
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(account));
  };

  const logout = () => {
    setActiveAccount(null);
    localStorage.removeItem(ACTIVE_KEY);
  };

  if (!ready) return null;

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
