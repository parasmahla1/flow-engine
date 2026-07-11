import type { NodeKind, PipelineNode } from "@flowengine/shared";
import { isNodeKind } from "@flowengine/shared";
import { assertExternalHttpUrl } from "./ssrf.js";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const requireNumber = (config: Record<string, unknown>, key: string, nodeId: string): number => {
  const value = config[key];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Node ${nodeId} requires numeric config "${key}".`);
  }

  return value;
};

const requireString = (config: Record<string, unknown>, key: string, nodeId: string): string => {
  const value = config[key];

  if (typeof value !== "string") {
    throw new Error(`Node ${nodeId} requires string config "${key}".`);
  }

  return value;
};

const validateKnownKind = (kind: string, nodeId: string): NodeKind => {
  if (!isNodeKind(kind)) {
    throw new Error(`Node ${nodeId} has unsupported type "${kind}".`);
  }

  return kind;
};

export const validateNodeConfig = (node: PipelineNode): void => {
  const kind = validateKnownKind(node.kind, node.id);

  if (node.data.kind !== kind) {
    throw new Error(`Node ${node.id} has mismatched type metadata.`);
  }

  const config = node.data.config as unknown;

  if (!isRecord(config)) {
    throw new Error(`Node ${node.id} must include a config object.`);
  }

  switch (kind) {
    case "MOCK_SOURCE": {
      const rowCount = requireNumber(config, "rowCount", node.id);
      const intervalMs = requireNumber(config, "intervalMs", node.id);

      if (rowCount < 1 || rowCount > 10000 || intervalMs < 0) {
        throw new Error(`Node ${node.id} has invalid mock source limits.`);
      }
      return;
    }
    case "HTTP_SOURCE": {
      const url = requireString(config, "url", node.id);
      const method = requireString(config, "method", node.id);

      if (method !== "GET" && method !== "POST") {
        throw new Error(`Node ${node.id} HTTP method must be GET or POST.`);
      }

      assertExternalHttpUrl(url);
      return;
    }
    case "DELAY": {
      const delayMs = requireNumber(config, "delayMs", node.id);

      if (delayMs < 0 || delayMs > 60000) {
        throw new Error(`Node ${node.id} delay must be between 0 and 60000ms.`);
      }
      return;
    }
    case "JSON_FILTER": {
      const expression = requireString(config, "expression", node.id);

      if (expression.trim().length === 0) {
        throw new Error(`Node ${node.id} requires a JSONPath expression.`);
      }
      return;
    }
    case "CONSOLE_SINK": {
      requireString(config, "prefix", node.id);
      return;
    }
  }
};
