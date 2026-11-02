import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Booster packs", description: "Open booster packs of oni, yokai and restless spirits. Free testnet demo.", path: "/packs" });

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
