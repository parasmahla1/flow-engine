import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import type { FastifyPluginAsync } from "fastify";
import type { AuthResponse } from "@flowengine/shared";
import { createAuthToken, hashPassword, requireAuth, verifyPassword } from "../services/auth.js";

interface CredentialsBody {
  username?: string;
  password?: string;
}

interface PersistedUser {
  id: string;
  username: string;
  passwordHash: string;
}

const normalizeCredentials = (body: unknown): Required<CredentialsBody> => {
  const value = typeof body === "object" && body !== null ? body : {};
  const username =
    "username" in value && typeof value.username === "string" ? value.username.trim() : "";
  const password = "password" in value && typeof value.password === "string" ? value.password : "";

  if (username.length < 3) {
    throw new Error("Username must be at least 3 characters.");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  return { username, password };
};

export const authRoutes = (prisma: PrismaClient): FastifyPluginAsync =>
  async (fastify) => {
    fastify.post<{ Body: CredentialsBody }>("/api/auth/register", async (request, reply) => {
      try {
        const { username, password } = normalizeCredentials(request.body);
        const users = await prisma.$queryRaw<Array<Omit<PersistedUser, "passwordHash">>>`
          INSERT INTO "User" ("id", "username", "passwordHash", "updatedAt")
          VALUES (${randomUUID()}, ${username}, ${hashPassword(password)}, NOW())
          RETURNING "id", "username"
        `;
        const user = users[0];

        if (!user) {
          throw new Error("Unable to register.");
        }

        const response: AuthResponse = {
          token: createAuthToken(user),
          user
        };

        reply.code(201);
        return response;
      } catch (error) {
        const message =
          error instanceof Error &&
          (error.message.includes("Unique constraint") || error.message.includes("duplicate key"))
            ? "Username is already taken."
            : error instanceof Error
              ? error.message
              : "Unable to register.";

        reply.code(message === "Username is already taken." ? 409 : 400);
        return { message };
      }
    });

    fastify.post<{ Body: CredentialsBody }>("/api/auth/login", async (request, reply) => {
      try {
        const { username, password } = normalizeCredentials(request.body);
        const users = await prisma.$queryRaw<PersistedUser[]>`
          SELECT "id", "username", "passwordHash"
          FROM "User"
          WHERE "username" = ${username}
          LIMIT 1
        `;
        const user = users[0];

        if (!user || !verifyPassword(password, user.passwordHash)) {
          reply.code(401);
          return { message: "Invalid username or password." };
        }

        const response: AuthResponse = {
          token: createAuthToken({ id: user.id, username: user.username }),
          user: { id: user.id, username: user.username }
        };

        return response;
      } catch (error) {
        reply.code(400);
        return { message: error instanceof Error ? error.message : "Unable to log in." };
      }
    });

    fastify.get("/api/auth/me", async (request, reply) => {
      try {
        return { user: await requireAuth(request, prisma) };
      } catch {
        reply.code(401);
        return { message: "Unauthorized" };
      }
    });
  };
