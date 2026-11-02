"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletReadyState, WalletName } from "@solana/wallet-adapter-base";
import { BASE_SEPOLIA_ID } from "../chains";

const PHANTOM = "Phantom" as WalletName<"Phantom">;

/** Phantom (Solana) connection helper: select → connect once the adapter is selected. */
export function usePhantom() {
  const sol = useWallet();
  const [wantConnect, setWantConnect] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const phantom = sol.wallets.find((w) => w.adapter.name === PHANTOM);
  const installed = phantom?.readyState === WalletReadyState.Installed || phantom?.readyState === WalletReadyState.Loadable;

  useEffect(() => {
    if (!wantConnect || sol.wallet?.adapter.name !== PHANTOM || sol.connected || sol.connecting) return;
    setWantConnect(false);
    sol.connect().catch((e: Error) => setError(e?.message || "Phantom connection was rejected"));
  }, [wantConnect, sol]);

  const connect = useCallback(() => {
    setError(null);
    if (!installed) {
      window.open("https://phantom.app/download", "_blank", "noopener,noreferrer");
      return;
    }
    if (sol.wallet?.adapter.name !== PHANTOM) sol.select(PHANTOM);
    setWantConnect(true);
  }, [installed, sol]);

  return {
    connect,
    installed,
    connecting: sol.connecting || wantConnect,
    address: sol.publicKey?.toBase58() ?? null,
    signMessage: sol.signMessage,
    error,
  };
}

/** MetaMask (EVM) connection helper pinned to Base Sepolia. */
export function useMetaMask() {
  const account = useAccount();
  const { connectAsync, connectors, isPending } = useConnect();
  const [error, setError] = useState<string | null>(null);
  const [hasProvider, setHasProvider] = useState(false);
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;
    setHasProvider(typeof window !== "undefined" && !!(window as unknown as { ethereum?: unknown }).ethereum);
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    if (!hasProvider) {
      window.open("https://metamask.io/download/", "_blank", "noopener,noreferrer");
      return;
    }
    try {
      const connector = connectors[0];
      if (account.isConnected) return;
      await connectAsync({ connector, chainId: BASE_SEPOLIA_ID });
    } catch (e) {
      const msg = (e as { shortMessage?: string; message?: string }).shortMessage || (e as Error).message;
      setError(msg || "MetaMask connection was rejected");
    }
  }, [account.isConnected, connectAsync, connectors, hasProvider]);

  return {
    connect,
    installed: hasProvider,
    connecting: isPending,
    address: account.address ?? null,
    chainId: account.chainId,
    onBaseSepolia: account.chainId === BASE_SEPOLIA_ID,
    error,
  };
}
