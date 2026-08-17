import { describe, expect, it } from "vitest";
import type { FlowEdge, FlowNode } from "@/store/pipelineStore";
import { defaultConfigForKind, labelForKind, type NodeKind } from "@flowengine/shared";
import { validateWorkflow } from "./pipelineValidation";

const node = (id: string, kind: NodeKind): FlowNode => ({
  id,
  type: "pipelineNode",
  position: { x: 0, y: 0 },
  data: {
    label: labelForKind(kind),
    kind,
    status: "idle",
    config: defaultConfigForKind(kind),
    preview: []
  }
});

const edge = (id: string, source: string, target: string): FlowEdge => ({
  id,
  source,
  target,
  sourceHandle: "output",
  targetHandle: "input"
});

describe("workflow validation", () => {
  it("marks a connected source-to-sink workflow ready", () => {
    const source = node("source", "MOCK_SOURCE");
    const sink = node("sink", "CONSOLE_SINK");

    expect(validateWorkflow([source, sink], [edge("edge", source.id, sink.id)]).isReady).toBe(true);
  });

  it("blocks an empty workflow", () => {
    const result = validateWorkflow([], []);

    expect(result.isReady).toBe(false);
    expect(result.issues[0]?.id).toBe("empty-pipeline");
  });

  it("warns about disconnected nodes", () => {
    const result = validateWorkflow([node("source", "MOCK_SOURCE"), node("sink", "CONSOLE_SINK")], []);

    expect(result.isReady).toBe(true);
    expect(result.issues.some((issue) => issue.severity === "warning")).toBe(true);
  });
});
