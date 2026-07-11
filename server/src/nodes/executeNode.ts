import type {
  ConsoleSinkConfig,
  DelayConfig,
  HttpSourceConfig,
  JsonFilterConfig,
  MockSourceConfig,
  PipelineNode
} from "@flowengine/shared";
import { runConsoleSink } from "./consoleSink.js";
import { runDelayNode } from "./delayNode.js";
import { runHttpSource } from "./httpSource.js";
import { runJsonFilter } from "./jsonFilter.js";
import { runMockSource } from "./mockSource.js";
import type { NodeExecutionResult, PipelineChunk } from "./types.js";

export const executePipelineNode = async (
  node: PipelineNode,
  inputChunks: PipelineChunk[]
): Promise<NodeExecutionResult> => {
  switch (node.kind) {
    case "MOCK_SOURCE":
      return runMockSource(node.data.config as MockSourceConfig);
    case "HTTP_SOURCE":
      return runHttpSource(node.data.config as HttpSourceConfig);
    case "DELAY":
      return runDelayNode((node.data.config as DelayConfig).delayMs, inputChunks);
    case "JSON_FILTER":
      return runJsonFilter(node.data.config as JsonFilterConfig, inputChunks);
    case "CONSOLE_SINK":
      return runConsoleSink(node.data.config as ConsoleSinkConfig, inputChunks);
  }
};
