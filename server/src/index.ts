import "./services/loadEnv.js";
import cors from "@fastify/cors";
import { PrismaClient } from "@prisma/client";
import fastify from "fastify";
import { Server } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "@flowengine/shared";
import { pipelineRoutes } from "./routes/pipelines.js";
import { registerPipelineSocket } from "./sockets/pipelineSocket.js";
import { createPipelineQueue, createPipelineWorker } from "./workers/pipelineWorker.js";

const port = Number(process.env.SERVER_PORT ?? 4000);
const clientUrl = process.env.CLIENT_URL ?? "http://localhost:3000";

const prisma = new PrismaClient();
const app = fastify({ logger: true });
const io = new Server<ClientToServerEvents, ServerToClientEvents>(app.server, {
  cors: {
    origin: clientUrl,
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const queue = createPipelineQueue();
const namespace = registerPipelineSocket(io, queue);
const worker = createPipelineWorker(namespace);

await app.register(cors, {
  origin: clientUrl,
  methods: ["GET", "POST", "PUT", "DELETE"]
});

await app.register(pipelineRoutes(prisma));

app.get("/health", async () => ({
  ok: true,
  service: "flowengine-server"
}));

const close = async (): Promise<void> => {
  await worker.close();
  await queue.close();
  await prisma.$disconnect();
  await app.close();
};

process.on("SIGTERM", () => {
  void close().finally(() => process.exit(0));
});

process.on("SIGINT", () => {
  void close().finally(() => process.exit(0));
});

await app.listen({ port, host: "0.0.0.0" });
