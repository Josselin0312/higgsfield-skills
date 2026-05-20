import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import { RoleProvider } from "@/lib/role";
import { SkillsProvider } from "@/lib/skillsStore";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IGFlow — Studio & CRM Instagram",
  description: "Plateforme de création de contenu IA et de gestion des DMs Instagram",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-white`}>
        <RoleProvider>
          <SkillsProvider>
            <Sidebar />
            <main className="ml-64 min-h-screen">{children}</main>
          </SkillsProvider>
        </RoleProvider>
      </body>
    </html>
  );
}
