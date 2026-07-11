import type { MockSourceConfig } from "@flowengine/shared";
import { chunkRecords, type NodeExecutionResult, type PipelineRecord } from "./types.js";

export const runMockSource = (config: MockSourceConfig): NodeExecutionResult => {
  const records: PipelineRecord[] = Array.from({ length: config.rowCount }, (_, index) => ({
    id: index + 1,
    temperature: Number((20 + Math.random() * 18).toFixed(2)),
    pressure: Number((95 + Math.random() * 10).toFixed(2)),
    createdAt: new Date().toISOString()
  }));

  return {
    chunks: chunkRecords(records),
    dataProcessed: records.length
  };
};
