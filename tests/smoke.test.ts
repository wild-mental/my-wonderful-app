import { describe, it, expect } from "vitest";

describe("smoke", () => {
  it("arithmetic sanity", () => {
    expect(1 + 1).toBe(2);
  });

  it("environment defaults", () => {
    expect(typeof process.env.NODE_ENV).toBe("string");
  });
});
