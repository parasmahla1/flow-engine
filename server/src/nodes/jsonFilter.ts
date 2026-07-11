import type { JsonFilterConfig } from "@flowengine/shared";
import { JSONPath } from "jsonpath-plus";
import { chunkRecords, type NodeExecutionResult, type PipelineChunk } from "./types.js";

export const runJsonFilter = (
  config: JsonFilterConfig,
  inputChunks: PipelineChunk[]
): NodeExecutionResult => {
  const records = inputChunks.flatMap((chunk) =>
    chunk.records.filter((record) => {
      const matches = JSONPath({
        path: config.expression,
        json: record,
        wrap: true
      }) as unknown[];

      return matches.length > 0;
    })
  );

  return {
    chunks: chunkRecords(records),
    dataProcessed: records.length
  };
};
