import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionGuard from "@/components/providers/SessionGuard";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Study Streak — EdTech Platform",
  description: "Track your study sessions, earn rubies, and achieve your learning goals.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="h-full antialiased">
        <SessionGuard />
        {children}
      </body>
    </html>
  );
}
