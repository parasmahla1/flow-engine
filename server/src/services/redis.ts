import Redis, { type RedisOptions } from "ioredis";

let loggedRedisError = false;

type RedisConnectionSettings =
  | {
      kind: "url";
      provider: "upstash" | "redis";
      useTls: boolean;
      url: string;
    }
  | {
      kind: "options";
      provider: "upstash" | "redis";
      useTls: boolean;
      host: string;
      port: number;
      username?: string;
      password?: string;
    };

const isTruthy = (value: string | undefined): boolean => value?.toLowerCase() === "true";

const optionalValue = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
};

const parsePort = (value: string | undefined): number => {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : 6379;
};

const getRedisConnectionSettings = (): RedisConnectionSettings => {
  const upstashRedisUrl = optionalValue(process.env.UPSTASH_REDIS_URL);
  const redisUrl = optionalValue(process.env.REDIS_URL);
  const envTls = isTruthy(process.env.REDIS_TLS);

  if (upstashRedisUrl?.startsWith("http")) {
    throw new Error(
      "UPSTASH_REDIS_URL must be the Redis TCP URL, for example rediss://default:<password>@<endpoint>.upstash.io:6379. Use the Redis/ioredis connection string, not the REST URL."
    );
  }

  if (upstashRedisUrl) {
    return {
      kind: "url",
      provider: "upstash",
      url: upstashRedisUrl,
      useTls: upstashRedisUrl.startsWith("rediss://") || envTls
    };
  }

  if (redisUrl) {
    if (redisUrl.startsWith("http")) {
      throw new Error(
        "REDIS_URL must be a Redis TCP URL, for example rediss://default:<password>@<endpoint>.upstash.io:6379. REST URLs cannot be used by BullMQ."
      );
    }

    return {
      kind: "url",
      provider: redisUrl.includes("upstash.io") ? "upstash" : "redis",
      url: redisUrl,
      useTls: redisUrl.startsWith("rediss://") || envTls
    };
  }

  const upstashHost =
    optionalValue(process.env.UPSTASH_REDIS_HOST) ??
    optionalValue(process.env.UPSTASH_REDIS_ENDPOINT);
  const upstashPassword = optionalValue(process.env.UPSTASH_REDIS_PASSWORD);
  const username =
    optionalValue(process.env.UPSTASH_REDIS_USERNAME) ??
    optionalValue(process.env.REDIS_USERNAME);
  const password = upstashPassword ?? optionalValue(process.env.REDIS_PASSWORD);

  if (!upstashHost && optionalValue(process.env.UPSTASH_REDIS_REST_URL)) {
    throw new Error(
      "BullMQ requires an Upstash TCP Redis URL. Set UPSTASH_REDIS_URL from the Redis/ioredis connection string, not UPSTASH_REDIS_REST_URL."
    );
  }

  return {
    kind: "options",
    provider: upstashHost ? "upstash" : "redis",
    host: upstashHost ?? optionalValue(process.env.REDIS_HOST) ?? "localhost",
    port: parsePort(
      upstashHost
        ? process.env.UPSTASH_REDIS_PORT ?? "6379"
        : process.env.REDIS_PORT
    ),
    useTls: upstashHost ? process.env.REDIS_TLS !== "false" : envTls,
    ...(username ? { username } : {}),
    ...(password ? { password } : {})
  };
};

const describeRedisTarget = (settings: RedisConnectionSettings): string => {
  if (settings.kind === "options") {
    return `${settings.provider}://${settings.host}:${settings.port} tls=${
      settings.useTls ? "on" : "off"
    } auth=${settings.password ? "yes" : "no"}`;
  }

  try {
    const parsed = new URL(settings.url);

    return `${settings.provider}:${parsed.protocol}//${parsed.hostname}${parsed.port ? `:${parsed.port}` : ""} tls=${
      settings.useTls ? "on" : "off"
    } auth=${parsed.password ? "yes" : "no"}`;
  } catch {
    return `invalid ${settings.provider} Redis URL tls=${settings.useTls ? "on" : "off"}`;
  }
};

const logRedisError = (settings: RedisConnectionSettings, error: Error): void => {
  if (loggedRedisError) {
    return;
  }

  loggedRedisError = true;
  console.error(`[redis] connection failed: ${describeRedisTarget(settings)}`);
  console.error(`[redis] ${error.message}`);

  if (error.message.includes("packet length too long")) {
    console.error(
      "[redis] TLS mismatch detected. Upstash TCP endpoints should usually use rediss:// or REDIS_TLS=true."
    );
  }

  if (settings.provider === "upstash" && settings.kind === "url" && settings.url.startsWith("https://")) {
    console.error(
      "[redis] UPSTASH_REDIS_URL must be the Redis TCP URL, for example rediss://default:<password>@<endpoint>.upstash.io:6379. The REST URL cannot be used by BullMQ."
    );
  }
};

export const createRedisConnection = (): Redis => {
  const settings = getRedisConnectionSettings();
  const options: RedisOptions = {
    maxRetriesPerRequest: null,
    retryStrategy: (times) => (times > 3 ? null : Math.min(times * 500, 2000)),
    ...(settings.useTls ? { tls: {} } : {})
  };

  const redis = settings.kind === "url"
    ? new Redis(settings.url, options)
    : new Redis({
        ...options,
        host: settings.host,
        port: settings.port,
        ...(settings.username ? { username: settings.username } : {}),
        ...(settings.password ? { password: settings.password } : {})
      });

  redis.on("error", (error) => {
    logRedisError(settings, error);
  });

  return redis;
};
