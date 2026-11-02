import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Battle", description: "Duel the Oni Bot with a five-card deck. Break the enemy hero before the fifteenth bell.", path: "/battle" });

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
