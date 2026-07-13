import { beforeEach, describe, expect, it } from "vitest";
import { usePipelineStore } from "./pipelineStore";

describe("pipeline store", () => {
  beforeEach(() => {
    usePipelineStore.setState({
      pipelineId: null,
      pipelineName: "Untitled pipeline",
      nodes: [],
      edges: [],
      selectedNodeId: null,
      isRunning: false,
      connectionStatus: "connected",
      lastExecutionId: null,
      lastError: null
    });
  });

  it("adds typed nodes to the graph", () => {
    const id = usePipelineStore.getState().addNode("MOCK_SOURCE", { x: 120, y: 140 });

    const node = usePipelineStore.getState().nodes.find((item) => item.id === id);

    expect(node?.data.kind).toBe("MOCK_SOURCE");
    expect(node?.position).toEqual({ x: 120, y: 140 });
  });

  it("connects output handles to input handles", () => {
    const source = usePipelineStore.getState().addNode("MOCK_SOURCE", { x: 0, y: 0 });
    const sink = usePipelineStore.getState().addNode("CONSOLE_SINK", { x: 320, y: 0 });

    const connected = usePipelineStore.getState().connectNodes({
      source,
      target: sink,
      sourceHandle: "output",
      targetHandle: "input"
    });

    expect(connected).toBe(true);
    expect(usePipelineStore.getState().edges).toHaveLength(1);
  });

  it("rejects cycle-forming connections", () => {
    const first = usePipelineStore.getState().addNode("DELAY", { x: 0, y: 0 });
    const second = usePipelineStore.getState().addNode("JSON_FILTER", { x: 320, y: 0 });

    expect(
      usePipelineStore.getState().connectNodes({
        source: first,
        target: second,
        sourceHandle: "output",
        targetHandle: "input"
      })
    ).toBe(true);

    expect(
      usePipelineStore.getState().connectNodes({
        source: second,
        target: first,
        sourceHandle: "output",
        targetHandle: "input"
      })
    ).toBe(false);
  });
});
