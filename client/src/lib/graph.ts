import type { NodeKind } from "@flowengine/shared";

interface GraphNode {
  id: string;
  data: {
    kind: NodeKind;
  };
}

interface GraphEdge {
  source: string;
  target: string;
}

const inputKinds: ReadonlySet<NodeKind> = new Set(["DELAY", "JSON_FILTER", "CONSOLE_SINK"]);
const outputKinds: ReadonlySet<NodeKind> = new Set(["MOCK_SOURCE", "HTTP_SOURCE", "DELAY", "JSON_FILTER"]);

export const canUseAsInput = (kind: NodeKind): boolean => inputKinds.has(kind);

export const canUseAsOutput = (kind: NodeKind): boolean => outputKinds.has(kind);

export const canConnectKinds = (sourceKind: NodeKind, targetKind: NodeKind): boolean =>
  canUseAsOutput(sourceKind) && canUseAsInput(targetKind);

export const wouldCreateCycle = (nodes: GraphNode[], edges: GraphEdge[]): boolean => {
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
