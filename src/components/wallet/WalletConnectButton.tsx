import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shortenAddress } from "@/lib/market/format";
import { isWalletConfigured } from "@/config/project";

/**
 * Shared connect/disconnect control — the single Connect Wallet button for
 * the whole app, rendered unconditionally inside SiteHeader (every page).
 * usePrivy()/useAccount() throw outside WalletProviders' context, and
 * WalletProviders is itself lazily loaded (see WalletProviders.tsx) behind a
 * Suspense whose fallback re-renders this same header tree without that
 * context — unlike SwapPage (gated behind its own route-level
 * Suspense/fallback=null and thus only soft-failing on /swap), a header
 * component sits on every route, so the same race would hard-fail every
 * page. Client-only mount-gating sidesteps it entirely: wallet connection
 * state can't be known during SSR anyway, so the hook-dependent button
 * simply doesn't render until after hydration.
 */
export function WalletConnectButton({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !isWalletConfigured()) return null;
  return <WalletConnectButtonInner className={className} />;
}

function WalletConnectButtonInner({ className }: { className?: string }) {
  const { address, isConnected } = useAccount();
  const { ready: privyReady, connectWallet, logout } = usePrivy();

  if (isConnected) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => logout()}
        className={className ? `gap-1.5 ${className}` : "gap-1.5"}
      >
        <Wallet className="size-3.5" />
        {shortenAddress(address, 4)}
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      disabled={!privyReady}
      onClick={() => connectWallet()}
      className={className ? `gap-1.5 rounded-full ${className}` : "gap-1.5 rounded-full"}
    >
      <Wallet className="size-3.5" />
      Connect
    </Button>
  );
}
