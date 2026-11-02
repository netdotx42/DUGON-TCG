"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import bs58 from "bs58";
import { useReadContract, useSignMessage, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import CardView from "@/components/CardView";
import { Button, DemoBadge, LinkButton, PageTitle } from "@/components/ui";
import { useProfile } from "@/lib/client/profile";
import { useGate } from "@/lib/client/useGate";
import { useMetaMask, usePhantom } from "@/lib/client/useWallets";
import { STARTER_IDS } from "@/lib/cards";
import { BASE_SEPOLIA_ID, DUGON_ABI, DUGON_CONTRACT, explorerTx, shortAddress } from "@/lib/chains";

type Status = { kind: "idle" | "working" | "error" | "done"; text?: string };

async function simulatedClaim(chain: "solana-devnet" | "base-sepolia", address: string, sign: (msg: string) => Promise<string>) {
  const ch = await fetch(`/api/auth/challenge?chain=${chain}&address=${encodeURIComponent(address)}`);
  const challenge = await ch.json();
  if (!ch.ok) throw new Error(challenge.error || "Could not get a sign-in challenge");
  const signature = await sign(challenge.message);
  const res = await fetch("/api/claim", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chain, address, message: challenge.message, token: challenge.token, signature }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || "Claim failed");
  return body as { alreadyClaimed: boolean };
}

function errText(e: unknown) {
  const x = e as { shortMessage?: string; message?: string };
  return x?.shortMessage || x?.message || "Something went wrong";
}

export default function ClaimPage() {
  const ok = useGate("identity");
  const router = useRouter();
  const { identity, profile, setClaim } = useProfile();
  const phantom = usePhantom();
  const metamask = useMetaMask();
  const { switchChainAsync } = useSwitchChain();
  const { signMessageAsync } = useSignMessage();
  const { writeContractAsync } = useWriteContract();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(profile.claim?.txHash as `0x${string}` | undefined);

  const isBase = identity?.chain === "base-sepolia";
  const evmAddr = identity?.address as `0x${string}` | undefined;
  const onChain = isBase && !!DUGON_CONTRACT;

  const claimedRead = useReadContract({
    address: DUGON_CONTRACT ?? undefined,
    abi: DUGON_ABI,
    functionName: "hasClaimed",
    args: evmAddr ? [evmAddr] : undefined,
    chainId: BASE_SEPOLIA_ID,
    query: { enabled: onChain && !!evmAddr },
  });
  const receipt = useWaitForTransactionReceipt({ hash: txHash, chainId: BASE_SEPOLIA_ID, query: { enabled: !!txHash && !profile.claim } });

  useEffect(() => {
    if (receipt.data && !profile.claim) {
      if (receipt.data.status === "success") {
        setClaim({ mode: "onchain", chain: "base-sepolia", txHash: receipt.data.transactionHash, at: new Date().toISOString() });
        setStatus({ kind: "done", text: "Minted on Base Sepolia." });
      } else {
        setStatus({ kind: "error", text: "Transaction reverted." });
      }
    }
  }, [receipt.data, profile.claim, setClaim]);

  if (!ok || !identity) return null;
  const claim = profile.claim;

  const walletMatches =
    identity.chain === "guest" ||
    (identity.chain === "solana-devnet" && phantom.address === identity.address) ||
    (isBase && metamask.address?.toLowerCase() === identity.address.toLowerCase());

  async function doClaim() {
    if (!identity) return;
    setStatus({ kind: "working", text: "Waiting for wallet…" });
    try {
      if (identity.chain === "guest") {
        setClaim({ mode: "simulated", chain: "guest", at: new Date().toISOString() });
      } else if (identity.chain === "solana-devnet") {
        if (!phantom.signMessage) throw new Error("This wallet cannot sign messages");
        const r = await simulatedClaim("solana-devnet", identity.address, async (m) =>
          bs58.encode(await phantom.signMessage!(new TextEncoder().encode(m))),
        );
        setClaim({ mode: "simulated", chain: "solana-devnet", at: new Date().toISOString() });
        setStatus({ kind: "done", text: r.alreadyClaimed ? "Signature verified. This wallet had already claimed; collection restored." : "Signature verified by the server." });
        return;
      } else {
        if (!metamask.onBaseSepolia) {
          setStatus({ kind: "working", text: "Switching to Base Sepolia…" });
          await switchChainAsync({ chainId: BASE_SEPOLIA_ID });
        }
        if (DUGON_CONTRACT) {
          const already = (await claimedRead.refetch()).data;
          if (already) {
            setClaim({ mode: "onchain", chain: "base-sepolia", at: new Date().toISOString() });
            setStatus({ kind: "done", text: "This address already claimed on-chain. Collection restored." });
            return;
          }
          setStatus({ kind: "working", text: "Confirm the mint in MetaMask…" });
          const hash = await writeContractAsync({ address: DUGON_CONTRACT, abi: DUGON_ABI, functionName: "claimStarter", chainId: BASE_SEPOLIA_ID });
          setTxHash(hash);
          setStatus({ kind: "working", text: "Transaction sent. Waiting for confirmation…" });
          return;
        }
        const r = await simulatedClaim("base-sepolia", identity.address, (message) => signMessageAsync({ message }));
        setClaim({ mode: "simulated", chain: "base-sepolia", at: new Date().toISOString() });
        setStatus({ kind: "done", text: r.alreadyClaimed ? "Signature verified. Already claimed; collection restored." : "Signature verified by the server." });
        return;
      }
      setStatus({ kind: "done" });
    } catch (e) {
      setStatus({ kind: "error", text: errText(e) });
    }
  }

  const modeLabel =
    identity.chain === "guest"
      ? "Guest mode: simulated claim stored in this browser."
      : identity.chain === "solana-devnet"
        ? "Solana Devnet: you sign a free message, the server verifies it, and the claim is simulated."
        : DUGON_CONTRACT
          ? `Base Sepolia: mints token ids 1–5 from contract ${shortAddress(DUGON_CONTRACT)}. One claim per address, enforced on-chain.`
          : "Base Sepolia contract not configured: you sign a free message and the claim is simulated.";
  const simulated = identity.chain !== "base-sepolia" || !DUGON_CONTRACT;
  const hash = (claim?.txHash as string | undefined) ?? txHash;

  return (
    <div>
      <PageTitle jp="召喚" title="Claim your starter pack" sub="Five spirits answer your first call. Free, once per wallet." />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {simulated ? <DemoBadge /> : <span className="border border-bone px-2 py-1 font-pixel text-[8px] tracking-widest">ON-CHAIN · BASE SEPOLIA</span>}
        <span className="font-mono text-xs text-ash">{modeLabel}</span>
      </div>

      <div className="mb-8 flex gap-3 overflow-x-auto pb-4">
        {STARTER_IDS.map((id, i) => (
          <div key={id} className={claim ? "animate-rise" : ""} style={{ animationDelay: `${i * 120}ms` }}>
            <CardView id={id} size="md" dim={!claim} owned={!!claim} />
          </div>
        ))}
      </div>

      {claim ? (
        <div className="flex flex-col gap-4">
          <p className="font-pixel text-xs text-bone">Starter pack claimed{claim.mode === "simulated" ? " (simulated)" : " on-chain"}.</p>
          {hash && (
            <a className="break-all font-mono text-xs text-bone underline decoration-dotted underline-offset-4" href={explorerTx(hash)} target="_blank" rel="noreferrer">
              Tx: {hash}
            </a>
          )}
          {status.text && <p className="font-mono text-xs text-ash">{status.text}</p>}
          <div className="flex gap-3">
            <LinkButton href="/collection">View collection</LinkButton>
            <LinkButton href="/deck" variant="ghost">
              Build deck
            </LinkButton>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3">
          {!walletMatches ? (
            <>
              <p className="font-mono text-xs text-ash">Your wallet is not connected in this tab. Reconnect to continue.</p>
              <Button onClick={() => router.push("/connect")}>Reconnect wallet</Button>
            </>
          ) : (
            <Button onClick={doClaim} disabled={status.kind === "working"}>
              {status.kind === "working" ? "Claiming…" : simulated ? "Claim (simulated)" : "Mint starter pack"}
            </Button>
          )}
          {isBase && walletMatches && !metamask.onBaseSepolia && (
            <p className="font-mono text-xs text-blood">Wrong network: MetaMask is on chain {metamask.chainId}. You will be asked to switch to Base Sepolia (84532).</p>
          )}
          {txHash && (
            <a className="break-all font-mono text-xs text-bone underline" href={explorerTx(txHash)} target="_blank" rel="noreferrer">
              Tx: {txHash}
            </a>
          )}
          {status.text && (
            <p role={status.kind === "error" ? "alert" : "status"} className={`font-mono text-xs ${status.kind === "error" ? "text-blood" : "text-ash"}`}>
              {status.text}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
