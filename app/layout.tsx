import type { Metadata, Viewport } from "next";
import { DotGothic16, Press_Start_2P } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Shell from "@/components/Shell";

const pixel = Press_Start_2P({ weight: "400", subsets: ["latin"], variable: "--font-pixel", display: "swap" });
const mono = DotGothic16({ weight: "400", subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "DUGON TCG — Oni card battles (testnet demo)",
  description: "A minimalist dark-fantasy trading card game. PvE demo on Solana Devnet and Base Sepolia.",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#000000", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${pixel.variable} ${mono.variable}`}>
      <body className="scanlines bg-ink text-bone">
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
