import type {
  DelayConfig,
  HttpSourceConfig,
  JsonFilterConfig,
  MockSourceConfig,
  PipelineNodeConfig
} from "@flowengine/shared";
import { canConnectKinds } from "./graph";
import type { FlowEdge, FlowNode } from "@/store/pipelineStore";

export type ValidationSeverity = "error" | "warning";

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  message: string;
  nodeId?: string;
  edgeId?: string;
}

export interface ValidationResult {
  issues: ValidationIssue[];
  isReady: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const configIssues = (node: FlowNode): ValidationIssue[] => {
  const config = node.data.config as PipelineNodeConfig;

  switch (node.data.kind) {
    case "MOCK_SOURCE":
      return typeof (config as MockSourceConfig).rowCount !== "number" ||
        (config as MockSourceConfig).rowCount < 1
        ? [
            {
              id: `${node.id}-row-count`,
              severity: "error",
              message: `${node.data.label} needs at least one generated row.`,
              nodeId: node.id
            }
          ]
        : [];
    case "HTTP_SOURCE":
      return !("url" in config) ||
        typeof (config as HttpSourceConfig).url !== "string" ||
        (config as HttpSourceConfig).url.trim().length === 0
        ? [
            {
              id: `${node.id}-url`,
              severity: "error",
              message: `${node.data.label} needs a URL.`,
              nodeId: node.id
            }
          ]
        : [];
    case "DELAY":
      return !("delayMs" in config) ||
        typeof (config as DelayConfig).delayMs !== "number" ||
        (config as DelayConfig).delayMs < 0
        ? [
            {
              id: `${node.id}-delay`,
              severity: "error",
              message: `${node.data.label} needs a non-negative delay.`,
              nodeId: node.id
            }
          ]
        : [];
    case "JSON_FILTER":
      return !("expression" in config) ||
        typeof (config as JsonFilterConfig).expression !== "string" ||
        (config as JsonFilterConfig).expression.trim().length === 0
        ? [
            {
              id: `${node.id}-expression`,
              severity: "error",
              message: `${node.data.label} needs a JSONPath expression.`,
              nodeId: node.id
            }
          ]
        : [];
    case "CONSOLE_SINK":
      return !isRecord(config) || !("prefix" in config)
        ? [
            {
              id: `${node.id}-prefix`,
              severity: "error",
              message: `${node.data.label} needs a prefix.`,
              nodeId: node.id
            }
          ]
        : [];
  }
};

const hasCycle = (nodes: FlowNode[], edges: FlowEdge[]): boolean => {
  const adjacency = new Map<string, string[]>();

  for (const node of nodes) {
    adjacency.set(node.id, []);
  }

  for (const edge of edges) {
    adjacency.get(edge.source)?.push(edge.target);
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (nodeId: string): boolean => {
    if (visiting.has(nodeId)) {
      return true;
    }

    if (visited.has(nodeId)) {
      return false;
    }

    visiting.add(nodeId);

    for (const targetId of adjacency.get(nodeId) ?? []) {
      if (visit(targetId)) {
        return true;
      }
    }

    visiting.delete(nodeId);
    visited.add(nodeId);
    return false;
  };

  return nodes.some((node) => visit(node.id));
};

export const validateWorkflow = (nodes: FlowNode[], edges: FlowEdge[]): ValidationResult => {
  const issues: ValidationIssue[] = [];
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const connectedNodeIds = new Set<string>();

  if (nodes.length === 0) {
    issues.push({
      id: "empty-pipeline",
      severity: "error",
      message: "Add at least one node before running."
    });
  }

  for (const node of nodes) {
    issues.push(...configIssues(node));
  }

  for (const edge of edges) {
    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);

    if (!source || !target) {
      issues.push({
        id: `${edge.id}-missing-node`,
        severity: "error",
        message: "An edge references a node that no longer exists.",
        edgeId: edge.id
      });
      continue;
    }

    connectedNodeIds.add(source.id);
    connectedNodeIds.add(target.id);

    if (
      edge.sourceHandle !== "output" ||
      edge.targetHandle !== "input" ||
      !canConnectKinds(source.data.kind, target.data.kind)
    ) {
      issues.push({
        id: `${edge.id}-invalid-connection`,
        severity: "error",
        message: `Invalid edge from ${source.data.label} to ${target.data.label}.`,
        edgeId: edge.id
      });
    }
  }

  if (hasCycle(nodes, edges)) {
    issues.push({
      id: "cycle",
      severity: "error",
      message: "The workflow contains a cycle."
    });
  }

  for (const node of nodes) {
    if (nodes.length > 1 && !connectedNodeIds.has(node.id)) {
      issues.push({
        id: `${node.id}-disconnected`,
        severity: "warning",
        message: `${node.data.label} is disconnected.`,
        nodeId: node.id
      });
    }
  }

  return {
    issues,
    isReady: issues.every((issue) => issue.severity !== "error")
  };
};
