import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Branch & Bound Visualizer — Airline Crew Assignment",
  description:
    "Interactive step-by-step educational visualizer for Branch and Bound applied to the Airline Crew Assignment problem.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Default to dark; client-side JS will switch to light if user preference saved
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
