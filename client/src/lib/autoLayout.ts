import type { Edge, Node } from "reactflow";

const columnGap = 300;
const rowGap = 150;
const startX = 80;
const startY = 80;

export const layoutDagLeftToRight = <TNode extends Node, TEdge extends Edge>(
  nodes: TNode[],
  edges: TEdge[]
): TNode[] => {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const incomingCount = new Map<string, number>();
  const outgoing = new Map<string, string[]>();

  for (const node of nodes) {
    incomingCount.set(node.id, 0);
    outgoing.set(node.id, []);
  }

  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      continue;
    }

    outgoing.get(edge.source)?.push(edge.target);
    incomingCount.set(edge.target, (incomingCount.get(edge.target) ?? 0) + 1);
  }

  const queue = nodes
    .filter((node) => (incomingCount.get(node.id) ?? 0) === 0)
    .map((node) => node.id);
  const levels = new Map<string, number>();

  for (const nodeId of queue) {
    levels.set(nodeId, 0);
  }

  while (queue.length > 0) {
    const nodeId = queue.shift();

    if (!nodeId) {
      continue;
    }

    const nextLevel = (levels.get(nodeId) ?? 0) + 1;

    for (const targetId of outgoing.get(nodeId) ?? []) {
      levels.set(targetId, Math.max(levels.get(targetId) ?? 0, nextLevel));
      incomingCount.set(targetId, (incomingCount.get(targetId) ?? 0) - 1);

      if ((incomingCount.get(targetId) ?? 0) === 0) {
        queue.push(targetId);
      }
    }
  }

  for (const node of nodes) {
    if (!levels.has(node.id)) {
      levels.set(node.id, 0);
    }
  }

  const grouped = new Map<number, TNode[]>();

  for (const node of nodes) {
    const level = levels.get(node.id) ?? 0;
    const bucket = grouped.get(level) ?? [];

    bucket.push(node);
    grouped.set(level, bucket);
  }

  const positions = new Map<string, TNode["position"]>();

  for (const [level, levelNodes] of grouped) {
    levelNodes.forEach((node, index) => {
      positions.set(node.id, {
        x: startX + level * columnGap,
        y: startY + index * rowGap
      });
    });
  }

  return nodes.map((node) => ({
    ...node,
    position: positions.get(node.id) ?? node.position
  }));
};
