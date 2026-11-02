import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Deck builder", description: "Build a five-card deck of oni and yokai for your next battle.", path: "/deck" });

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
