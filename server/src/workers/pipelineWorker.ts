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

const cancelledExecutionIds = new Set<string>();

export const requestExecutionCancellation = (executionId: string): void => {
  cancelledExecutionIds.add(executionId);
};

const isExecutionCancelled = (executionId: string): boolean =>
  cancelledExecutionIds.has(executionId);

const clearExecutionCancellation = (executionId: string): void => {
  cancelledExecutionIds.delete(executionId);
};

const emitExecutionCancelled = (
  namespace: PipelineNamespace,
  executionId: string,
  message = "Execution cancelled."
): void => {
  namespace.emit("execution_cancelled", { executionId, message });
};

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
  let completedNodes = 0;
  const totalNodes = pipeline.nodes.length;

  for (const level of levels) {
    if (isExecutionCancelled(executionId)) {
      emitExecutionCancelled(namespace, executionId);
      clearExecutionCancellation(executionId);
      return { totalDuration: Date.now() - startedAt, totalDataProcessed };
    }

    await Promise.all(
      level.map(async (node) => {
        if (isExecutionCancelled(executionId)) {
          return;
        }

        namespace.emit("node_status_changed", { nodeId: node.id, status: "processing" });
        namespace.emit("execution_progress", {
          executionId,
          completedNodes,
          totalNodes,
          currentNodeId: node.id
        });

        try {
          const inputChunks = incomingChunksForNode(node.id, pipeline.edges, chunksByNodeId);
          const result = await executePipelineNode(node, inputChunks);
          const inputRecords = inputChunks.flatMap((chunk) => chunk.records);

          chunksByNodeId.set(node.id, result.chunks);
          totalDataProcessed += result.dataProcessed;
          completedNodes += 1;
          namespace.emit("node_status_changed", { nodeId: node.id, status: "success" });
          namespace.emit("execution_progress", {
            executionId,
            completedNodes,
            totalNodes,
            currentNodeId: node.id
          });

          if (node.kind === "CONSOLE_SINK") {
            namespace.emit("node_output", {
              nodeId: node.id,
              inputRecords: inputRecords.slice(-25),
              records: inputRecords.slice(-25),
              emittedAt: new Date().toISOString()
            });
          }

          for (const edge of outgoingEdgesForNode(node.id, pipeline.edges)) {
            for (const chunk of result.chunks) {
              namespace.emit("data_flow", {
                edgeId: edge.id,
                chunkSize: chunk.records.length
              });
            }
          }
        } catch (error) {
          clearExecutionCancellation(executionId);
          emitNodeError(namespace, executionId, node.id, error);
          throw error;
        }
      })
    );

    if (isExecutionCancelled(executionId)) {
      emitExecutionCancelled(namespace, executionId);
      clearExecutionCancellation(executionId);
      return { totalDuration: Date.now() - startedAt, totalDataProcessed };
    }
  }

  clearExecutionCancellation(executionId);
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
