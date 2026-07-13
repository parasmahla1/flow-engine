import { describe, expect, it } from "vitest";
import type { NodeKind, PipelineEdge, PipelineNode } from "@flowengine/shared";
import { defaultConfigForKind, labelForKind } from "@flowengine/shared";
import { DagValidationError, topologicalSort, validateDag } from "../services/dag.js";

const node = (id: string, kind: NodeKind): PipelineNode => ({
  id,
  type: "pipelineNode",
  kind,
  position: { x: 0, y: 0 },
  data: {
    label: labelForKind(kind),
    kind,
    status: "idle",
    config: defaultConfigForKind(kind),
    preview: []
  }
});

const edge = (id: string, source: string, target: string): PipelineEdge => ({
  id,
  source,
  target,
  sourceHandle: "output",
  targetHandle: "input"
});

describe("DAG validation", () => {
  it("topologically sorts a valid pipeline", () => {
    const nodes = [node("source", "MOCK_SOURCE"), node("delay", "DELAY"), node("sink", "CONSOLE_SINK")];
    const edges = [edge("e1", "source", "delay"), edge("e2", "delay", "sink")];

    expect(topologicalSort(nodes, edges).map((pipelineNode) => pipelineNode.id)).toEqual([
      "source",
      "delay",
      "sink"
    ]);
  });

  it("groups independent nodes into the same execution level", () => {
    const nodes = [
      node("source-a", "MOCK_SOURCE"),
      node("source-b", "MOCK_SOURCE"),
      node("sink-a", "CONSOLE_SINK"),
      node("sink-b", "CONSOLE_SINK")
    ];
    const edges = [edge("e1", "source-a", "sink-a"), edge("e2", "source-b", "sink-b")];

    const { levels } = validateDag(nodes, edges);

    expect(levels.map((level) => level.map((pipelineNode) => pipelineNode.id))).toEqual([
      ["source-a", "source-b"],
      ["sink-a", "sink-b"]
    ]);
  });

  it("throws when a graph contains a cycle", () => {
    const nodes = [node("a", "DELAY"), node("b", "JSON_FILTER")];
    const edges = [edge("e1", "a", "b"), edge("e2", "b", "a")];

    expect(() => validateDag(nodes, edges)).toThrow(DagValidationError);
  });

  it("rejects invalid output-to-output style handle metadata", () => {
    const nodes = [node("source", "MOCK_SOURCE"), node("sink", "CONSOLE_SINK")];
    const edges: PipelineEdge[] = [
      {
        ...edge("e1", "source", "sink"),
        targetHandle: "output" as "input"
      }
    ];

    expect(() => validateDag(nodes, edges)).toThrow("output to input");
  });
});
