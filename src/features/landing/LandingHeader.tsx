import { Link } from "@tanstack/react-router";
import { AnimatedPulseLogo } from "@/components/branding/AnimatedPulseLogo";
import { Button } from "@/components/ui/button";

const anchorLinks = [
  { href: "#what-is", label: "Product" },
  { href: "#features", label: "Features" },
  { href: "#terminal", label: "Terminal" },
  { href: "#agents", label: "Agents" },
  { href: "#roadmap", label: "Roadmap" },
];

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-lg">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <a href="#top" className="flex shrink-0 items-center gap-2" aria-label="RobinPulse home">
          <AnimatedPulseLogo size={26} />
          <span className="text-sm font-semibold tracking-tight text-foreground">RobinPulse</span>
        </a>

        <nav className="ml-8 hidden items-center gap-6 lg:flex" aria-label="Page sections">
          {anchorLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto">
          <Button asChild className="rounded-full">
            <Link to="/app">Open App</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
