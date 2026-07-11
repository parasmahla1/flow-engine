import type { NodeKind, PipelineEdge, PipelineNode } from "@flowengine/shared";

export class DagValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DagValidationError";
  }
}

export interface DagValidationResult {
  order: PipelineNode[];
  levels: PipelineNode[][];
}

const inputKinds: ReadonlySet<NodeKind> = new Set(["DELAY", "JSON_FILTER", "CONSOLE_SINK"]);
const outputKinds: ReadonlySet<NodeKind> = new Set(["MOCK_SOURCE", "HTTP_SOURCE", "DELAY", "JSON_FILTER"]);

const assertValidPorts = (
  edge: PipelineEdge,
  sourceNode: PipelineNode,
  targetNode: PipelineNode
): void => {
  if (edge.sourceHandle !== "output" || edge.targetHandle !== "input") {
    throw new DagValidationError(`Edge ${edge.id} must connect output to input.`);
  }

  if (!outputKinds.has(sourceNode.kind)) {
    throw new DagValidationError(`Node ${sourceNode.id} cannot be used as an edge source.`);
  }

  if (!inputKinds.has(targetNode.kind)) {
    throw new DagValidationError(`Node ${targetNode.id} cannot be used as an edge target.`);
  }
};

export const validateDag = (nodes: PipelineNode[], edges: PipelineEdge[]): DagValidationResult => {
  if (nodes.length === 0) {
    throw new DagValidationError("Pipeline must contain at least one node.");
  }

  const nodeById = new Map<string, PipelineNode>();

  for (const node of nodes) {
    if (nodeById.has(node.id)) {
      throw new DagValidationError(`Duplicate node id "${node.id}".`);
    }

    nodeById.set(node.id, node);
  }

  const incomingCount = new Map<string, number>();
  const outgoing = new Map<string, PipelineEdge[]>();

  for (const node of nodes) {
    incomingCount.set(node.id, 0);
    outgoing.set(node.id, []);
  }

  for (const edge of edges) {
    const sourceNode = nodeById.get(edge.source);
    const targetNode = nodeById.get(edge.target);

    if (edge.source === edge.target) {
      throw new DagValidationError(`Edge ${edge.id} cannot connect a node to itself.`);
    }

    if (!sourceNode || !targetNode) {
      throw new DagValidationError(`Edge ${edge.id} references a missing node.`);
    }

    assertValidPorts(edge, sourceNode, targetNode);

    incomingCount.set(edge.target, (incomingCount.get(edge.target) ?? 0) + 1);
    outgoing.get(edge.source)?.push(edge);
  }

  const levels: PipelineNode[][] = [];
  const order: PipelineNode[] = [];
  let ready = nodes.filter((node) => (incomingCount.get(node.id) ?? 0) === 0);

  while (ready.length > 0) {
    const currentLevel = [...ready];
    const nextReady: PipelineNode[] = [];

    levels.push(currentLevel);

    for (const node of currentLevel) {
      order.push(node);

      for (const edge of outgoing.get(node.id) ?? []) {
        const nextCount = (incomingCount.get(edge.target) ?? 0) - 1;
        incomingCount.set(edge.target, nextCount);

        if (nextCount === 0) {
          const targetNode = nodeById.get(edge.target);

          if (targetNode) {
            nextReady.push(targetNode);
          }
        }
      }
    }

    ready = nextReady;
  }

  if (order.length !== nodes.length) {
    throw new DagValidationError("Pipeline graph contains a cycle.");
  }

  return { order, levels };
};

export const topologicalSort = (nodes: PipelineNode[], edges: PipelineEdge[]): PipelineNode[] =>
  validateDag(nodes, edges).order;
