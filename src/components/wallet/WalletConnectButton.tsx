import { useEffect, useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import { ChevronDown, Copy, ExternalLink, LogOut, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { shortenAddress } from "@/lib/market/format";
import { isWalletConfigured } from "@/config/project";
import { robinhoodChain } from "@/config/robinhoodChain";

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
  const { disconnect } = useDisconnect();
  const { ready: privyReady, connectWallet, logout } = usePrivy();

  // wagmi's disconnect() is a synchronous local store mutation — isConnected
  // flips immediately. Privy's logout() also revokes the session/embedded
  // wallet server-side, which is real async work; firing it right after
  // (not awaited) keeps that cleanup happening without making the UI wait
  // on it. A rejection there is backgrounded cleanup failing, not something
  // the click handler needs to surface.
  function handleDisconnect() {
    disconnect();
    logout().catch(() => {});
  }

  if (isConnected && address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={className ? `gap-1.5 ${className}` : "gap-1.5"}
          >
            <Wallet className="size-3.5" />
            {shortenAddress(address, 4)}
            <ChevronDown className="size-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(address);
                toast.success("Address copied");
              } catch {
                toast.error("Could not copy address");
              }
            }}
          >
            <Copy className="size-3.5" />
            Copy address
          </DropdownMenuItem>
          {robinhoodChain?.blockExplorers?.default.url ? (
            <DropdownMenuItem asChild>
              <a
                href={`${robinhoodChain.blockExplorers.default.url}/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="size-3.5" />
                View on Blockscout
              </a>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleDisconnect}
            className="text-negative focus:text-negative"
          >
            <LogOut className="size-3.5" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
