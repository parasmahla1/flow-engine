import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const parseEnvLine = (line: string): [string, string] | null => {
  const trimmed = line.trim();

  if (!trimmed || trimmed.startsWith("#")) {
    return null;
  }

  const match = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(trimmed);

  if (!match) {
    return null;
  }

  const key = match[1];
  const rawValue = match[2] ?? "";

  if (!key) {
    return null;
  }

  const value = rawValue.trim().replace(/^["']|["']$/g, "");

  return [key, value];
};

const applyEnvFile = (path: string, protectedKeys: ReadonlySet<string>): void => {
  if (!existsSync(path)) {
    return;
  }

  const lines = readFileSync(path, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const parsed = parseEnvLine(line);

    if (!parsed) {
      continue;
    }

    const [key, value] = parsed;

    if (!protectedKeys.has(key)) {
      process.env[key] = value;
    }
  }
};

export const loadEnvFiles = (): void => {
  const serviceDir = dirname(fileURLToPath(import.meta.url));
  const serverRoot = resolve(serviceDir, "../..");
  const repoRoot = resolve(serverRoot, "..");
  const protectedKeys = new Set(Object.keys(process.env));

  for (const path of [
    resolve(repoRoot, ".env"),
    resolve(serverRoot, ".env"),
    resolve(repoRoot, ".env.local"),
    resolve(serverRoot, ".env.local")
  ]) {
    applyEnvFile(path, protectedKeys);
  }
};

loadEnvFiles();
