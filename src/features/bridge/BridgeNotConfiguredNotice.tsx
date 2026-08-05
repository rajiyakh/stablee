export function BridgeNotConfiguredNotice({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-border bg-card backdrop-blur-sm p-6 text-center text-sm text-muted-foreground">
      <p className="font-medium text-foreground">Bridging isn't live yet</p>
      <p className="mt-1.5">{message}</p>
    </div>
  );
}
