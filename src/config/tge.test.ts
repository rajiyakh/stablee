import { describe, expect, it } from "vitest";
import {
  isClaimLive,
  tgeConfig,
  TGE_NOT_ANNOUNCED_MESSAGE,
  MANUAL_DISTRIBUTION_MESSAGE,
} from "./tge";

describe("tge config", () => {
  it("defaults to not-announced with claiming disabled", () => {
    expect(tgeConfig.status).toBe("not-announced");
    expect(tgeConfig.claimEnabled).toBe(false);
    expect(tgeConfig.distributionMode).toBe("not-decided");
  });

  it("ships with an empty date, never a placeholder date", () => {
    expect(tgeConfig.date).toBe("");
  });

  it("isClaimLive is false with the default shipped config (status not-announced, claimEnabled false)", () => {
    expect(isClaimLive()).toBe(false);
  });

  it("exposes the exact required copy for an unannounced TGE and manual distribution", () => {
    expect(TGE_NOT_ANNOUNCED_MESSAGE).toBe("To be announced");
    expect(MANUAL_DISTRIBUTION_MESSAGE).toContain("distributed after TGE");
  });
});
