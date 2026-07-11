import type { JsonObject } from "@flowengine/shared";

export type PipelineRecord = JsonObject;

export interface PipelineChunk {
  records: PipelineRecord[];
}

export interface NodeExecutionResult {
  chunks: PipelineChunk[];
  dataProcessed: number;
}

export const chunkRecords = (records: PipelineRecord[], size = 50): PipelineChunk[] => {
  const chunks: PipelineChunk[] = [];

  for (let index = 0; index < records.length; index += size) {
    chunks.push({ records: records.slice(index, index + size) });
  }

  return chunks;
};
