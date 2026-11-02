import type { Metadata } from "next";

// Absolute base for share-card URLs (og:image, og:url). Override with NEXT_PUBLIC_SITE_URL for a custom domain.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://dugon-tcg.vercel.app").replace(/\/+$/, "");
export const SITE_NAME = "DUGON TCG";
export const SITE_DESCRIPTION =
  "Summon oni, yokai and restless spirits in a free pixel trading card game. Testnet demo on Solana Devnet and Base Sepolia.";

const SHARE_IMAGE = { url: "/og.png", width: 1200, height: 630, alt: "DUGON TCG oni mask logo: oni card battles, free trading card game demo" };

/** Title, description, canonical URL and Open Graph / X card tags for one page. */
export function pageMetadata({ title, description = SITE_DESCRIPTION, path = "/" }: { title?: string; description?: string; path?: string }): Metadata {
  const shareTitle = title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} · Oni card battles`;
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", siteName: SITE_NAME, locale: "en_US", url: path, title: shareTitle, description, images: [SHARE_IMAGE] },
    twitter: { card: "summary_large_image", title: shareTitle, description, images: [SHARE_IMAGE] },
  };
}
