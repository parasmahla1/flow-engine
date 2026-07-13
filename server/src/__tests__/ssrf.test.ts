import { describe, expect, it } from "vitest";
import { isBlockedHttpUrl } from "../services/ssrf.js";

describe("SSRF URL validation", () => {
  it("blocks localhost and private IP ranges", () => {
    expect(isBlockedHttpUrl("http://localhost:3000")).toBe(true);
    expect(isBlockedHttpUrl("http://127.0.0.1:3000")).toBe(true);
    expect(isBlockedHttpUrl("http://192.168.1.10")).toBe(true);
    expect(isBlockedHttpUrl("http://10.0.0.4")).toBe(true);
  });

  it("allows public HTTP(S) endpoints", () => {
    expect(isBlockedHttpUrl("https://example.com/data.json")).toBe(false);
  });
});
