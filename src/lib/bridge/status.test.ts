import { describe, expect, it } from "vitest";
import { mapProviderStatus } from "./status";

describe("mapProviderStatus", () => {
  it("never returns completed without destinationConfirmed true", () => {
    const result = mapProviderStatus({
      category: "destination_confirmed",
      destinationConfirmed: false,
    });
    expect(result).not.toBe("completed");
    expect(result).toBe("destination_pending");
  });

  it("returns completed only when the category AND destinationConfirmed both agree", () => {
    const result = mapProviderStatus({
      category: "destination_confirmed",
      destinationConfirmed: true,
    });
    expect(result).toBe("completed");
  });

  it("maps source_confirmed to bridging", () => {
    expect(mapProviderStatus({ category: "source_confirmed", destinationConfirmed: false })).toBe(
      "bridging",
    );
  });

  it("maps bridging to destination_pending", () => {
    expect(mapProviderStatus({ category: "bridging", destinationConfirmed: false })).toBe(
      "destination_pending",
    );
  });

  it("maps failed/refund states directly, independent of destinationConfirmed", () => {
    expect(mapProviderStatus({ category: "failed", destinationConfirmed: false })).toBe("failed");
    expect(mapProviderStatus({ category: "refund_pending", destinationConfirmed: false })).toBe(
      "refund_required",
    );
    expect(mapProviderStatus({ category: "refunded", destinationConfirmed: false })).toBe(
      "refunded",
    );
  });

  it("maps an unrecognized pending category to submitted", () => {
    expect(mapProviderStatus({ category: "pending", destinationConfirmed: false })).toBe(
      "submitted",
    );
  });
});
