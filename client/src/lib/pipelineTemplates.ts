import type { NodeKind, PipelineEdge, PipelineNode, PipelineSchema, Position } from "@flowengine/shared";
import { defaultConfigForKind, labelForKind } from "@flowengine/shared";

export interface PipelineTemplate {
  id: string;
  name: string;
  description: string;
  nodes: NodeKind[];
}

export const pipelineTemplates: readonly PipelineTemplate[] = [
  {
    id: "mock-delay-console",
    name: "Mock Source -> Delay -> Console Sink",
    description: "Generate sample rows, pause processing, then inspect output.",
    nodes: ["MOCK_SOURCE", "DELAY", "CONSOLE_SINK"]
  },
  {
    id: "http-filter-console",
    name: "HTTP Source -> JSON Filter -> Console Sink",
    description: "Fetch JSON, keep matching records, then inspect output.",
    nodes: ["HTTP_SOURCE", "JSON_FILTER", "CONSOLE_SINK"]
  }
];

const createTemplateNode = (kind: NodeKind, position: Position): PipelineNode => {
  const id = crypto.randomUUID();

  return {
    id,
    type: "pipelineNode",
    kind,
    position,
    data: {
      label: labelForKind(kind),
      kind,
      status: "idle",
      config: defaultConfigForKind(kind),
      preview: []
    }
  };
};

export const buildPipelineFromTemplate = (template: PipelineTemplate): PipelineSchema => {
  const nodes = template.nodes.map((kind, index) =>
    createTemplateNode(kind, {
      x: 80 + index * 300,
      y: 120
    })
  );
  const edges: PipelineEdge[] = nodes.slice(0, -1).flatMap((node, index) => {
    const target = nodes[index + 1];

    if (!target) {
      return [];
    }

    return {
      id: `${node.id}-${target.id}-${crypto.randomUUID()}`,
      source: node.id,
      target: target.id,
      sourceHandle: "output",
      targetHandle: "input"
    };
  });

  return {
    name: template.name,
    nodes,
    edges
  };
};
