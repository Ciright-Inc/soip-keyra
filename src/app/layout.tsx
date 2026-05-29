import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import { SoipSessionWatcher } from "@/components/SoipSessionWatcher";
import { KeyraSessionProvider } from "@/contexts/KeyraSessionContext";
import { resolveKeyraSessionFromCookies } from "@/lib/keyraSessionServer";
import type { KeyraSessionUser } from "@/lib/keyraSessionTypes";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SOIP — Sovereign Operational Intelligence Platform",
  description:
    "Keyra Global Trust Infrastructure. Sovereign operational intelligence for governments, enterprises, telecom operators, and trusted organizations.",
  icons: { icon: "/favicon.png" },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let initialUser: KeyraSessionUser | null = null;
  try {
    initialUser = await resolveKeyraSessionFromCookies();
  } catch {
    initialUser = null;
  }

  return (
    <html lang="en-IE" className={`${inter.variable} ${montserrat.variable} h-full`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
        />
      </head>
      <body className="min-h-full antialiased">
        <KeyraSessionProvider initialUser={initialUser}>
          <SoipSessionWatcher />
          {children}
        </KeyraSessionProvider>
      </body>
    </html>
  );
}
