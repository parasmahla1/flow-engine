import { type NodeExecutionResult, type PipelineChunk } from "./types.js";

export const runDelayNode = async (
  delayMs: number,
  inputChunks: PipelineChunk[]
): Promise<NodeExecutionResult> => {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, delayMs);
  });

  const recordsProcessed = inputChunks.reduce((total, chunk) => total + chunk.records.length, 0);

  return {
    chunks: inputChunks,
    dataProcessed: recordsProcessed
  };
};
