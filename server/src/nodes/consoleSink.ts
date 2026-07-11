import type { ConsoleSinkConfig } from "@flowengine/shared";
import { type NodeExecutionResult, type PipelineChunk } from "./types.js";

export const runConsoleSink = (
  config: ConsoleSinkConfig,
  inputChunks: PipelineChunk[]
): NodeExecutionResult => {
  const recordsProcessed = inputChunks.reduce((total, chunk) => total + chunk.records.length, 0);

  for (const chunk of inputChunks) {
    console.info(`[${config.prefix}]`, JSON.stringify(chunk.records.slice(0, 5)));
  }

  return {
    chunks: [],
    dataProcessed: recordsProcessed
  };
};
