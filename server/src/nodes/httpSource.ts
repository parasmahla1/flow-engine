import type { HttpSourceConfig } from "@flowengine/shared";
import { assertExternalHttpUrl } from "../services/ssrf.js";
import { normalizeJsonRecords } from "./json.js";
import { chunkRecords, type NodeExecutionResult } from "./types.js";

export const runHttpSource = async (config: HttpSourceConfig): Promise<NodeExecutionResult> => {
  assertExternalHttpUrl(config.url);

  const requestInit: RequestInit = {
    method: config.method,
    headers: config.headers
  };

  if (config.method === "POST" && config.body.length > 0) {
    requestInit.body = config.body;
  }

  const response = await fetch(config.url, requestInit);

  if (!response.ok) {
    throw new Error(`HTTP Source request failed with ${response.status}.`);
  }

  const payload: unknown = await response.json();
  const records = normalizeJsonRecords(payload);

  return {
    chunks: chunkRecords(records),
    dataProcessed: records.length
  };
};
