"use client";

import { useMemo, useState } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { wagmiConfig } from "@/lib/client/wagmi";
import { SOLANA_DEVNET_RPC } from "@/lib/chains";
import { ProfileProvider } from "@/lib/client/profile";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectionProvider endpoint={SOLANA_DEVNET_RPC}>
          <WalletProvider wallets={wallets} autoConnect={false}>
            <ProfileProvider>{children}</ProfileProvider>
          </WalletProvider>
        </ConnectionProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
