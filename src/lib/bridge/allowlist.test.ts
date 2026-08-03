import { describe, expect, it } from "vitest";
import {
  UntrustedHostError,
  assertAllowedHost,
  isAllowedContract,
  parseContractAllowlist,
} from "./allowlist";

describe("assertAllowedHost", () => {
  it("allows a provider's real, known host", () => {
    expect(() => assertAllowedHost("lifi", "https://li.quest/v1/chains")).not.toThrow();
    expect(() => assertAllowedHost("relay", "https://api.relay.link/chains")).not.toThrow();
    expect(() => assertAllowedHost("across", "https://app.across.to/api/swap")).not.toThrow();
    expect(() => assertAllowedHost("gaszip", "https://backend.gas.zip/v2/chains")).not.toThrow();
  });

  it("rejects a lookalike host", () => {
    expect(() => assertAllowedHost("lifi", "https://li.quest.evil.com/v1/chains")).toThrow(
      UntrustedHostError,
    );
  });

  it("rejects a host missing the subdomain", () => {
    expect(() => assertAllowedHost("relay", "https://apirelay.link/chains")).toThrow(
      UntrustedHostError,
    );
  });

  it("rejects a completely unrelated host", () => {
    expect(() => assertAllowedHost("across", "https://evil.example.com/steal")).toThrow(
      UntrustedHostError,
    );
  });
});

describe("parseContractAllowlist", () => {
  it("returns an empty object for an empty/undefined value", () => {
    expect(parseContractAllowlist(undefined)).toEqual({});
    expect(parseContractAllowlist("")).toEqual({});
    expect(parseContractAllowlist("   ")).toEqual({});
  });

  it("returns an empty object for malformed JSON rather than throwing", () => {
    expect(parseContractAllowlist("{not json")).toEqual({});
  });

  it("parses a valid chainId -> address list map", () => {
    const result = parseContractAllowlist('{"4663":["0xabc"],"1":["0xdef","0x123"]}');
    expect(result).toEqual({ 4663: ["0xabc"], 1: ["0xdef", "0x123"] });
  });
});

describe("isAllowedContract", () => {
  it("allows anything when no allowlist is configured for the chain (empty means trust provider response)", () => {
    expect(isAllowedContract({}, 4663, "0xanything")).toBe(true);
  });

  it("allows an address that is pinned, case-insensitively", () => {
    const allowlist = { 4663: ["0xAbC0000000000000000000000000000000dEf1"] };
    expect(isAllowedContract(allowlist, 4663, "0xabc0000000000000000000000000000000def1")).toBe(
      true,
    );
  });

  it("rejects an address that is not on a non-empty pinned list", () => {
    const allowlist = { 4663: ["0xAbC0000000000000000000000000000000dEf1"] };
    expect(isAllowedContract(allowlist, 4663, "0x9999999999999999999999999999999999999")).toBe(
      false,
    );
  });
});
