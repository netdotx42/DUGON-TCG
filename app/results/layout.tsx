import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Battle results", description: "See how your last duel against the Oni Bot went, and the XP you earned.", path: "/results" });

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
