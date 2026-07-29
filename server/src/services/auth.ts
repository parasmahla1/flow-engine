import { randomBytes, pbkdf2Sync, timingSafeEqual, createHmac } from "node:crypto";
import type { FastifyRequest } from "fastify";
import type { PrismaClient } from "@prisma/client";
import type { AuthUser } from "@flowengine/shared";

interface TokenPayload {
  sub: string;
  username: string;
  exp: number;
}

const tokenTtlSeconds = 60 * 60 * 24 * 7;
const passwordIterations = 210000;
const passwordKeyLength = 32;
const passwordDigest = "sha256";

const base64UrlEncode = (value: string | Buffer): string =>
  Buffer.from(value).toString("base64url");

const base64UrlDecode = (value: string): string =>
  Buffer.from(value, "base64url").toString("utf8");

const authSecret = (): string => {
  const secret = process.env.AUTH_TOKEN_SECRET;

  if (secret && secret.length >= 24) {
    return secret;
  }

  return "flowengine-local-development-secret";
};

export const hashPassword = (password: string): string => {
  const salt = randomBytes(16).toString("base64url");
  const hash = pbkdf2Sync(password, salt, passwordIterations, passwordKeyLength, passwordDigest);

  return `${passwordIterations}:${salt}:${hash.toString("base64url")}`;
};

export const verifyPassword = (password: string, storedHash: string): boolean => {
  const [iterationsText, salt, hashText] = storedHash.split(":");
  const iterations = Number(iterationsText);

  if (!iterations || !salt || !hashText) {
    return false;
  }

  const expected = Buffer.from(hashText, "base64url");
  const actual = pbkdf2Sync(password, salt, iterations, expected.length, passwordDigest);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
};

export const createAuthToken = (user: AuthUser): string => {
  const payload: TokenPayload = {
    sub: user.id,
    username: user.username,
    exp: Math.floor(Date.now() / 1000) + tokenTtlSeconds
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = createHmac("sha256", authSecret()).update(encodedPayload).digest("base64url");

  return `${encodedPayload}.${signature}`;
};

export const verifyAuthToken = (token: string): AuthUser | null => {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = createHmac("sha256", authSecret())
    .update(encodedPayload)
    .digest("base64url");
  const expectedBuffer = Buffer.from(expectedSignature);
  const actualBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== actualBuffer.length || !timingSafeEqual(expectedBuffer, actualBuffer)) {
    return null;
  }

  let payload: Partial<TokenPayload>;

  try {
    payload = JSON.parse(base64UrlDecode(encodedPayload)) as Partial<TokenPayload>;
  } catch {
    return null;
  }

  if (
    typeof payload.sub !== "string" ||
    typeof payload.username !== "string" ||
    typeof payload.exp !== "number" ||
    payload.exp < Math.floor(Date.now() / 1000)
  ) {
    return null;
  }

  return {
    id: payload.sub,
    username: payload.username
  };
};

const bearerTokenFromRequest = (request: FastifyRequest): string | null => {
  const header = request.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim();
};

export const requireAuth = async (
  request: FastifyRequest,
  prisma: PrismaClient
): Promise<AuthUser> => {
  const token = bearerTokenFromRequest(request);
  const tokenUser = token ? verifyAuthToken(token) : null;

  if (!tokenUser) {
    throw new Error("Unauthorized");
  }

  const users = await prisma.$queryRaw<AuthUser[]>`
    SELECT "id", "username"
    FROM "User"
    WHERE "id" = ${tokenUser.id}
    LIMIT 1
  `;
  const user = users[0];

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
};
