import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Claim starter cards", description: "Claim five free starter cards to begin your DUGON journey. Testnet only.", path: "/claim" });

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
