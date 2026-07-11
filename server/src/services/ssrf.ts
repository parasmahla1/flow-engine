import { isIP } from "node:net";

const blockedHostnames = new Set(["localhost", "localhost.localdomain"]);

const isBlockedIpv4 = (hostname: string): boolean => {
  const octets = hostname.split(".").map((part) => Number(part));

  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet))) {
    return false;
  }

  const [first, second] = octets;

  if (first === undefined || second === undefined) {
    return false;
  }

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    first >= 224
  );
};

const isBlockedIpv6 = (hostname: string): boolean => {
  const normalized = hostname.toLowerCase();

  return (
    normalized === "::1" ||
    normalized === "::" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:")
  );
};

export const isBlockedHttpUrl = (input: string): boolean => {
  let parsed: URL;

  try {
    parsed = new URL(input);
  } catch {
    return true;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return true;
  }

  const hostname = parsed.hostname.replace(/^\[/, "").replace(/\]$/, "").toLowerCase();

  if (
    blockedHostnames.has(hostname) ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    return true;
  }

  const ipVersion = isIP(hostname);

  if (ipVersion === 4) {
    return isBlockedIpv4(hostname);
  }

  if (ipVersion === 6) {
    return isBlockedIpv6(hostname);
  }

  return false;
};

export const assertExternalHttpUrl = (input: string): void => {
  if (isBlockedHttpUrl(input)) {
    throw new Error("HTTP Source URL must be an external HTTP(S) address.");
  }
};
