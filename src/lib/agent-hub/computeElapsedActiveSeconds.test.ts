import { describe, expect, it } from "vitest";
import { computeElapsedActiveSeconds } from "./computeElapsedActiveSeconds";

describe("computeElapsedActiveSeconds", () => {
  const now = new Date("2026-01-01T12:00:00.000Z");

  it("accrues zero seconds for a preview position", () => {
    const seconds = computeElapsedActiveSeconds(
      { activatedAt: now.toISOString(), lastClaimedAt: undefined, status: "preview" },
      now,
    );
    expect(seconds).toBe(0);
  });

  it("accrues zero seconds for a pending-activation position", () => {
    const seconds = computeElapsedActiveSeconds(
      { activatedAt: now.toISOString(), lastClaimedAt: undefined, status: "pending-activation" },
      now,
    );
    expect(seconds).toBe(0);
  });

  it("accrues elapsed time for a farming position since activation", () => {
    const activatedAt = new Date(now.getTime() - 3_600_000).toISOString(); // 1 hour ago
    const seconds = computeElapsedActiveSeconds(
      { activatedAt, lastClaimedAt: undefined, status: "farming" },
      now,
    );
    expect(seconds).toBe(3600);
  });

  it("accrues from lastClaimedAt, not activatedAt, once a claim has happened", () => {
    const activatedAt = new Date(now.getTime() - 10_000_000).toISOString();
    const lastClaimedAt = new Date(now.getTime() - 1_800_000).toISOString(); // 30 min ago
    const seconds = computeElapsedActiveSeconds(
      { activatedAt, lastClaimedAt, status: "farming" },
      now,
    );
    expect(seconds).toBe(1800);
  });

  it("still accrues for a claimable position (time since last claim continues to count)", () => {
    const activatedAt = new Date(now.getTime() - 7200_000).toISOString();
    const seconds = computeElapsedActiveSeconds(
      { activatedAt, lastClaimedAt: undefined, status: "claimable" },
      now,
    );
    expect(seconds).toBe(7200);
  });

  it("freezes accrual for a paused position (no pause-history log, so it returns 0 additional)", () => {
    const activatedAt = new Date(now.getTime() - 3_600_000).toISOString();
    const seconds = computeElapsedActiveSeconds(
      { activatedAt, lastClaimedAt: undefined, status: "paused" },
      now,
    );
    expect(seconds).toBe(0);
  });

  it("does not accrue further once claimed", () => {
    const activatedAt = new Date(now.getTime() - 3_600_000).toISOString();
    const seconds = computeElapsedActiveSeconds(
      { activatedAt, lastClaimedAt: now.toISOString(), status: "claimed" },
      now,
    );
    expect(seconds).toBe(0);
  });

  it("never returns a negative number for a clock-skewed future activatedAt", () => {
    const activatedAt = new Date(now.getTime() + 1_000_000).toISOString();
    const seconds = computeElapsedActiveSeconds(
      { activatedAt, lastClaimedAt: undefined, status: "farming" },
      now,
    );
    expect(seconds).toBe(0);
  });

  it("returns 0 for a malformed timestamp instead of throwing", () => {
    const seconds = computeElapsedActiveSeconds(
      { activatedAt: "not-a-date", lastClaimedAt: undefined, status: "farming" },
      now,
    );
    expect(seconds).toBe(0);
  });
});
