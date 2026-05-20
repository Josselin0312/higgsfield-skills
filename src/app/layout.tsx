import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { RoleProvider } from "@/lib/role";
import { SkillsProvider } from "@/lib/skillsStore";
import { AccountProvider } from "@/lib/accountStore";
import AppShell from "@/components/layout/AppShell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IGFlow",
  description: "Studio IA & CRM Instagram",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-white`}>
        <AccountProvider>
          <RoleProvider>
            <SkillsProvider>
              <AppShell>{children}</AppShell>
            </SkillsProvider>
          </RoleProvider>
        </AccountProvider>
      </body>
    </html>
  );
}
