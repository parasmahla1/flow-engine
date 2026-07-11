import type { PipelineSchema } from "@flowengine/shared";
import { defaultConfigForKind, isNodeKind, labelForKind } from "@flowengine/shared";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const parsePipelinePayload = (payload: unknown): PipelineSchema => {
  if (!isRecord(payload)) {
    throw new Error("Pipeline payload must be an object.");
  }

  const { id, name, nodes, edges } = payload;

  if (typeof name !== "string" || name.trim().length === 0) {
    throw new Error("Pipeline name is required.");
  }

  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    throw new Error("Pipeline payload requires nodes and edges arrays.");
  }

  const parsedNodes = nodes.map((node): PipelineSchema["nodes"][number] => {
    if (!isRecord(node) || typeof node.id !== "string" || !isRecord(node.position)) {
      throw new Error("Each node requires id and position.");
    }

    const data = isRecord(node.data) ? node.data : {};
    const rawKind = typeof node.kind === "string" ? node.kind : data.kind;

    if (typeof rawKind !== "string" || !isNodeKind(rawKind)) {
      throw new Error(`Node ${node.id} has an unsupported type.`);
    }

    const x = node.position.x;
    const y = node.position.y;

    if (typeof x !== "number" || typeof y !== "number") {
      throw new Error(`Node ${node.id} requires numeric x/y coordinates.`);
    }

    const config = isRecord(data.config)
      ? { ...defaultConfigForKind(rawKind), ...data.config }
      : defaultConfigForKind(rawKind);

    return {
      id: node.id,
      type: "pipelineNode",
      kind: rawKind,
      position: { x, y },
      data: {
        label: typeof data.label === "string" ? data.label : labelForKind(rawKind),
        kind: rawKind,
        status: "idle",
        config,
        preview: []
      }
    };
  });

  const parsedEdges = edges.map((edge): PipelineSchema["edges"][number] => {
    if (
      !isRecord(edge) ||
      typeof edge.id !== "string" ||
      typeof edge.source !== "string" ||
      typeof edge.target !== "string"
    ) {
      throw new Error("Each edge requires id, source, and target.");
    }

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: "output",
      targetHandle: "input"
    };
  });

  return {
    ...(typeof id === "string" ? { id } : {}),
    name: name.trim(),
    nodes: parsedNodes,
    edges: parsedEdges
  };
};
