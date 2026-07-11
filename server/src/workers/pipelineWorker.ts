import { Queue, Worker, type Job } from "bullmq";
import type { Namespace } from "socket.io";
import type {
  ClientToServerEvents,
  PipelineEdge,
  PipelineSchema,
  ServerToClientEvents
} from "@flowengine/shared";
import { executePipelineNode } from "../nodes/executeNode.js";
import type { PipelineChunk } from "../nodes/types.js";
import { createRedisConnection } from "../services/redis.js";
import { validatePipeline } from "../services/pipelineValidation.js";

export interface ExecutionJob {
  executionId: string;
  pipeline: PipelineSchema;
}

export interface ExecutionResult {
  totalDuration: number;
  totalDataProcessed: number;
}

export type PipelineNamespace = Namespace<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  Record<string, never>
>;

export const createPipelineQueue = (): Queue<ExecutionJob, ExecutionResult> =>
  new Queue<ExecutionJob, ExecutionResult>("pipeline-execution", {
    connection: createRedisConnection()
  });

const incomingChunksForNode = (
  nodeId: string,
  edges: PipelineEdge[],
  chunksByNodeId: Map<string, PipelineChunk[]>
): PipelineChunk[] =>
  edges
    .filter((edge) => edge.target === nodeId)
    .flatMap((edge) => chunksByNodeId.get(edge.source) ?? []);

const outgoingEdgesForNode = (nodeId: string, edges: PipelineEdge[]): PipelineEdge[] =>
  edges.filter((edge) => edge.source === nodeId);

const emitNodeError = (
  namespace: PipelineNamespace,
  executionId: string,
  nodeId: string,
  error: unknown
): void => {
  const message = error instanceof Error ? error.message : "Unknown execution error.";

  namespace.emit("node_status_changed", { nodeId, status: "error", message });
  namespace.emit("execution_error", { executionId, nodeId, message });
};

const executeJob = async (
  job: Job<ExecutionJob, ExecutionResult>,
  namespace: PipelineNamespace
): Promise<ExecutionResult> => {
  const startedAt = Date.now();
  const { executionId, pipeline } = job.data;
  const { levels } = validatePipeline(pipeline);
  const chunksByNodeId = new Map<string, PipelineChunk[]>();
  let totalDataProcessed = 0;

  for (const level of levels) {
    await Promise.all(
      level.map(async (node) => {
        namespace.emit("node_status_changed", { nodeId: node.id, status: "processing" });

        try {
          const inputChunks = incomingChunksForNode(node.id, pipeline.edges, chunksByNodeId);
          const result = await executePipelineNode(node, inputChunks);

          chunksByNodeId.set(node.id, result.chunks);
          totalDataProcessed += result.dataProcessed;
          namespace.emit("node_status_changed", { nodeId: node.id, status: "success" });

          for (const edge of outgoingEdgesForNode(node.id, pipeline.edges)) {
            for (const chunk of result.chunks) {
              namespace.emit("data_flow", {
                edgeId: edge.id,
                chunkSize: chunk.records.length
              });
            }
          }
        } catch (error) {
          emitNodeError(namespace, executionId, node.id, error);
          throw error;
        }
      })
    );
  }

  const totalDuration = Date.now() - startedAt;

  namespace.emit("execution_completed", {
    executionId,
    totalDuration,
    totalDataProcessed
  });

  return { totalDuration, totalDataProcessed };
};

export const createPipelineWorker = (namespace: PipelineNamespace): Worker<ExecutionJob, ExecutionResult> => {
  const worker = new Worker<ExecutionJob, ExecutionResult>(
    "pipeline-execution",
    (job) => executeJob(job, namespace),
    {
      connection: createRedisConnection(),
      concurrency: 4
    }
  );

  worker.on("failed", (job, error) => {
    namespace.emit(
      "execution_error",
      job?.data.executionId
        ? { executionId: job.data.executionId, message: error.message }
        : { message: error.message }
    );
  });

  return worker;
};
