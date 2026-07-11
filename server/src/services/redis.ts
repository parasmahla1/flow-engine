import Redis from "ioredis";

export const createRedisConnection = (): Redis =>
  new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null
  });
