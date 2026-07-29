import Redis, { type RedisOptions } from "ioredis";

let loggedRedisError = false;

type RedisConnectionSettings =
  | {
      kind: "url";
      useTls: boolean;
      url: string;
    }
  | {
      kind: "options";
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
  const redisUrl = optionalValue(process.env.REDIS_URL);
  const envTls = isTruthy(process.env.REDIS_TLS);

  if (redisUrl) {
    return {
      kind: "url",
      url: redisUrl,
      useTls: redisUrl.startsWith("rediss://") || envTls
    };
  }

  const username = optionalValue(process.env.REDIS_USERNAME);
  const password = optionalValue(process.env.REDIS_PASSWORD);

  return {
    kind: "options",
    host: optionalValue(process.env.REDIS_HOST) ?? "localhost",
    port: parsePort(process.env.REDIS_PORT),
    useTls: envTls,
    ...(username ? { username } : {}),
    ...(password ? { password } : {})
  };
};

const describeRedisTarget = (settings: RedisConnectionSettings): string => {
  if (settings.kind === "options") {
    return `redis://${settings.host}:${settings.port} tls=${settings.useTls ? "on" : "off"} auth=${
      settings.password ? "yes" : "no"
    }`;
  }

  try {
    const parsed = new URL(settings.url);

    return `${parsed.protocol}//${parsed.hostname}${parsed.port ? `:${parsed.port}` : ""} tls=${
      settings.useTls ? "on" : "off"
    } auth=${parsed.password ? "yes" : "no"}`;
  } catch {
    return `invalid Redis URL tls=${settings.useTls ? "on" : "off"}`;
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
      "[redis] TLS mismatch detected. Use redis:// with REDIS_TLS=false for a non-TLS Redis Cloud endpoint, or use the Redis Cloud TLS endpoint with rediss://."
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
