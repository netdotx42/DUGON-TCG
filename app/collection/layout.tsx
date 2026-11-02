import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Card collection", description: "Browse every DUGON card: oni, yokai and restless spirits drawn in pixel art.", path: "/collection" });

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
