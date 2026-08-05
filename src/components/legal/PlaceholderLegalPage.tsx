import { Link } from "@tanstack/react-router";
import { AnimatedPulseLogo } from "@/components/branding/AnimatedPulseLogo";

export function PlaceholderLegalPage({ title }: { title: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16 text-center">
      <AnimatedPulseLogo size={36} />
      <h1 className="mt-6 font-display text-3xl tracking-tight text-foreground sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        The full {title.toLowerCase()} will be published here soon. This is a placeholder page.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center rounded-full border border-border bg-card px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/70"
      >
        Back to RobinPulse
      </Link>
    </main>
  );
}
