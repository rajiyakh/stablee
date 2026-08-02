import { describe, expect, it } from "vitest";
import { deriveSentiment, formatTokenAmount } from "./format";

describe("formatTokenAmount", () => {
  it("trims a full-precision decimal string to the max decimal places", () => {
    expect(formatTokenAmount("1234.567891234567891234", 6)).toBe("1234.567891");
  });

  it("drops trailing zeros left after trimming", () => {
    expect(formatTokenAmount("1.500000000000000000", 6)).toBe("1.5");
  });

  it("returns just the whole part when trimming leaves nothing but zeros", () => {
    expect(formatTokenAmount("42.000000000000000001", 6)).toBe("42");
  });

  it("leaves a value with no decimal point untouched", () => {
    expect(formatTokenAmount("100", 6)).toBe("100");
  });

  it("leaves a value already within the max decimal places untouched", () => {
    expect(formatTokenAmount("0.01", 6)).toBe("0.01");
  });

  it("defaults to 6 max decimal places", () => {
    expect(formatTokenAmount("1.1234567891")).toBe("1.123456");
  });
});

describe("deriveSentiment", () => {
  it("returns bullish when 24h change meets the positive threshold", () => {
    expect(deriveSentiment(3)).toBe("bullish");
    expect(deriveSentiment(12.5)).toBe("bullish");
  });

  it("returns bearish when 24h change meets the negative threshold", () => {
    expect(deriveSentiment(-3)).toBe("bearish");
    expect(deriveSentiment(-12.5)).toBe("bearish");
  });

  it("returns neutral within the threshold band", () => {
    expect(deriveSentiment(2.9)).toBe("neutral");
    expect(deriveSentiment(-2.9)).toBe("neutral");
    expect(deriveSentiment(0)).toBe("neutral");
  });

  it("returns neutral for null, undefined, or non-finite values", () => {
    expect(deriveSentiment(null)).toBe("neutral");
    expect(deriveSentiment(undefined)).toBe("neutral");
    expect(deriveSentiment(Number.NaN)).toBe("neutral");
  });
});
