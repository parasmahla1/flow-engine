import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const parseEnvLine = (line) => {
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

  return [key, rawValue.trim().replace(/^["']|["']$/g, "")];
};

const applyEnvFile = (path, protectedKeys) => {
  if (!existsSync(path)) {
    return;
  }

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
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

const serverRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
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

const localPrismaBin = resolve(
  repoRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "prisma.cmd" : "prisma"
);
const prismaCommand = existsSync(localPrismaBin) ? localPrismaBin : "prisma";

const result = spawnSync(prismaCommand, process.argv.slice(2), {
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32"
});

if (result.error) {
  console.error(result.error.message);
}

process.exit(result.status ?? 1);
