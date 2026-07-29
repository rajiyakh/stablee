import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { AnimatedPulseLogo } from "@/components/branding/AnimatedPulseLogo";
import { Button } from "@/components/ui/button";
import { Reveal } from "../Reveal";

export function FinalCtaSection() {
  return (
    <section className="border-t border-border/70 bg-card/30">
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <Reveal>
          <AnimatedPulseLogo size={48} className="mx-auto" />
          <h2 className="mt-6 font-display text-3xl tracking-tight text-foreground sm:text-4xl">
            Ready to explore RobinPulse?
          </h2>
          <div className="mt-8">
            <Button asChild size="lg" className="rounded-full px-10">
              <Link to="/app">
                Open App
                <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
