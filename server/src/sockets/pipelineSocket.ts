import { randomUUID } from "node:crypto";
import type { Queue } from "bullmq";
import type {
  ClientToServerEvents,
  PipelineSchema,
  ServerToClientEvents
} from "@flowengine/shared";
import type { Server } from "socket.io";
import { verifyAuthToken } from "../services/auth.js";
import { parsePipelinePayload } from "../services/pipelinePayload.js";
import { validatePipeline } from "../services/pipelineValidation.js";
import {
  requestExecutionCancellation,
  type ExecutionJob,
  type ExecutionResult,
  type PipelineNamespace
} from "../workers/pipelineWorker.js";

export const registerPipelineSocket = (
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  queue: Queue<ExecutionJob, ExecutionResult>
): PipelineNamespace => {
  const namespace = io.of("/pipeline") as PipelineNamespace;

  namespace.use((socket, next) => {
    const token = typeof socket.handshake.auth.token === "string" ? socket.handshake.auth.token : "";

    if (!verifyAuthToken(token)) {
      next(new Error("Unauthorized"));
      return;
    }

    next();
  });

  namespace.on("connection", (socket) => {
    socket.on("execute_pipeline", async (rawPayload: PipelineSchema) => {
      const executionId = randomUUID();

      try {
        const pipeline = parsePipelinePayload(rawPayload);
        validatePipeline(pipeline);

        socket.emit("execution_started", { executionId });
        await queue.add(
          "execute",
          { executionId, pipeline },
          {
            jobId: executionId,
            removeOnComplete: 50,
            removeOnFail: 100
          }
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to execute pipeline.";
        socket.emit("execution_error", { executionId, message });
      }
    });

    socket.on("cancel_execution", async ({ executionId }) => {
      requestExecutionCancellation(executionId);

      try {
        const job = await queue.getJob(executionId);

        if (!job) {
          socket.emit("execution_cancelled", {
            executionId,
            message: "Execution cancelled."
          });
          return;
        }

        const isActive = await job.isActive();

        if (!isActive) {
          await job.remove();
          socket.emit("execution_cancelled", {
            executionId,
            message: "Execution cancelled."
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to cancel execution.";
        socket.emit("execution_error", { executionId, message });
      }
    });
  });

  return namespace;
};
