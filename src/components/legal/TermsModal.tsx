import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatedPulseLogo } from "@/components/branding/AnimatedPulseLogo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const AGREEMENT_POINTS = [
  "You understand the risks of digital assets.",
  "You are using RobinPulse at your own discretion.",
  "You have read and accepted the Terms & Conditions.",
  "You have read and accepted the Privacy Policy.",
] as const;

const FOOTER_LINKS = [
  { to: "/terms" as const, label: "Terms & Conditions" },
  { to: "/privacy" as const, label: "Privacy Policy" },
  { to: "/app/disclaimer" as const, label: "Risk Disclosure" },
] as const;

/**
 * No onKeyDown handler for Escape anywhere in this component — that's
 * intentional and is the entire mechanism by which Escape does nothing.
 * There's also no Radix Dialog primitive wrapping this (which would fight
 * us on outside-click/Escape auto-dismiss); a plain fixed overlay gives full
 * control. Focus containment comes for free from TermsGate making the rest
 * of the page `inert` — there is nothing else in the DOM to Tab into.
 */
export function TermsModal({ onAccept }: { onAccept: () => void }) {
  const [checked, setChecked] = useState(false);
  const checkboxRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // preventScroll matters here: on short viewports the checkbox sits below
    // the fold of the scrollable card, so a normal focus() would jump the
    // card straight to it and hide the welcome title/agreement text.
    checkboxRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div
      className="animate-terms-overlay fixed inset-0 z-[100] flex items-center justify-center bg-background/70 p-4 backdrop-blur-md"
      style={{ backdropFilter: "blur(12px)" }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-modal-title"
        aria-describedby="terms-modal-subtitle"
        className="animate-terms-modal max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-border bg-card/95 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
      >
        <AnimatedPulseLogo size={40} className="mx-auto" />

        <h1
          id="terms-modal-title"
          className="mt-4 text-center font-display text-3xl tracking-tight text-foreground sm:text-4xl"
        >
          Welcome to RobinPulse
        </h1>
        <p
          id="terms-modal-subtitle"
          className="mt-2 text-center text-sm text-muted-foreground sm:text-base"
        >
          Before accessing RobinPulse, please review and accept our Terms & Conditions.
        </p>

        <div className="mt-6 space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            RobinPulse is an AI-powered market intelligence platform built for educational and
            informational purposes only.
          </p>
          <p>
            Nothing displayed on this website constitutes financial, investment or trading advice.
          </p>
          <p>Digital assets are highly volatile and involve significant risk.</p>
          <p>You are solely responsible for your own investment decisions.</p>
          <p>Past performance does not guarantee future results.</p>
          <p>
            RobinPulse, its contributors and affiliates are not liable for any financial losses
            resulting from the use of this platform.
          </p>
          <p className="font-medium text-foreground">By continuing, you confirm that:</p>
          <ul className="space-y-1.5">
            {AGREEMENT_POINTS.map((point) => (
              <li key={point} className="flex gap-2">
                <span className="text-primary">•</span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <label className="mt-6 flex cursor-pointer items-start gap-2.5 rounded-xl bg-secondary/60 p-3.5">
          <Checkbox
            ref={checkboxRef}
            checked={checked}
            onCheckedChange={(value) => setChecked(value === true)}
            className="mt-0.5 transition-transform data-[state=checked]:scale-110"
          />
          <span className="text-sm text-foreground">
            I have read and agree to the Terms & Conditions and Privacy Policy.
          </span>
        </label>

        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
          <Button
            size="lg"
            disabled={!checked}
            onClick={onAccept}
            className="flex-1 rounded-full transition-transform active:scale-[0.98]"
          >
            Enter RobinPulse
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => {
              window.location.href = "https://google.com";
            }}
            className="flex-1 rounded-full transition-transform active:scale-[0.98]"
          >
            Leave Website
          </Button>
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-1 border-t border-border/70 pt-4">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
