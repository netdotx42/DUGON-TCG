"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageTitle, Button, DemoBadge } from "@/components/ui";
import { useProfile } from "@/lib/client/profile";
import { useMetaMask, usePhantom } from "@/lib/client/useWallets";
import { isValidAddress, shortAddress } from "@/lib/chains";

function WalletCard(props: {
  title: string;
  jp: string;
  network: string;
  note: string;
  installed: boolean;
  connecting: boolean;
  error: string | null;
  onClick: () => void;
  installName: string;
}) {
  return (
    <div className="panel flex flex-col gap-3 p-6">
      <div className="neon-soft font-mono text-base">{props.jp}</div>
      <div className="neon font-pixel text-lg">{props.title}</div>
      <div className="font-mono text-xs text-bone">{props.network}</div>
      <p className="font-mono text-sm leading-relaxed text-bone/75">{props.note}</p>
      <Button onClick={props.onClick} disabled={props.connecting} className="mt-auto">
        {props.connecting ? "Connecting…" : props.installed ? `Connect ${props.title}` : `Install ${props.installName}`}
      </Button>
      {props.error && (
        <p role="alert" className="font-mono text-xs text-blood">
          {props.error}
        </p>
      )}
    </div>
  );
}

export default function ConnectPage() {
  const router = useRouter();
  const { identity, setIdentity } = useProfile();
  const phantom = usePhantom();
  const metamask = useMetaMask();

  // Adopt a wallet as the player identity only after the user explicitly picked it.
  const [pending, setPending] = useState<null | "sol" | "evm">(null);
  useEffect(() => {
    if (pending === "sol" && phantom.address && isValidAddress("solana-devnet", phantom.address)) {
      setPending(null);
      setIdentity({ chain: "solana-devnet", address: phantom.address });
      router.push("/claim");
    }
  }, [pending, phantom.address, setIdentity, router]);
  useEffect(() => {
    if (pending === "evm" && metamask.address && isValidAddress("base-sepolia", metamask.address)) {
      setPending(null);
      setIdentity({ chain: "base-sepolia", address: metamask.address });
      router.push("/claim");
    }
  }, [pending, metamask.address, setIdentity, router]);

  const connectPhantom = () => {
    setPending("sol");
    phantom.connect();
  };
  const connectMetaMask = async () => {
    setPending("evm");
    await metamask.connect();
  };

  return (
    <div>
      <PageTitle
        jp="接続"
        title="Connect a wallet"
        sub="Testnet only. DUGON will never ask for your seed phrase or private key, and never requests a payment."
      />
      {identity && (
        <div className="mb-6 flex flex-wrap items-center gap-3 font-mono text-sm">
          <span className="text-ash">Signed in as</span>
          <span className="text-bone">{identity.chain === "guest" ? "guest" : shortAddress(identity.address)}</span>
          <Button variant="ghost" onClick={() => router.push("/claim")}>
            Continue
          </Button>
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-2">
        <WalletCard
          title="Phantom"
          jp="ソラナ"
          network="Solana Devnet"
          note="Connect and sign a free message to prove ownership. Card claims on Solana are simulated (demo only)."
          installed={phantom.installed}
          connecting={phantom.connecting}
          error={phantom.error}
          onClick={connectPhantom}
          installName="Phantom"
        />
        <WalletCard
          title="MetaMask"
          jp="ベース"
          network="Base Sepolia · chain 84532"
          note="Mint the starter pack as ERC-1155 tokens on Base Sepolia. You need a little Sepolia test ETH for gas."
          installed={metamask.installed}
          connecting={metamask.connecting}
          error={metamask.error}
          onClick={connectMetaMask}
          installName="MetaMask"
        />
      </div>
      <div className="pixel-border-dim mt-10 flex flex-col items-start gap-3 p-6">
        <DemoBadge>No wallet? Guest mode is simulated</DemoBadge>
        <p className="max-w-xl font-mono text-sm text-bone/75">
          Play the full PvE demo without a wallet. Nothing is signed or minted; progress stays in this browser.
        </p>
        <Button
          variant="ghost"
          onClick={() => {
            setIdentity({ chain: "guest", address: "guest" });
            router.push("/claim");
          }}
        >
          Play as guest
        </Button>
      </div>
    </div>
  );
}
