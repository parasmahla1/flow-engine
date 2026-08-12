import { beforeEach, describe, expect, it } from "vitest";
import { usePipelineStore } from "./pipelineStore";

describe("pipeline store", () => {
  beforeEach(() => {
    usePipelineStore.setState({
      pipelineId: null,
      pipelineName: "Untitled pipeline",
      nodes: [],
      edges: [],
      historyPast: [],
      historyFuture: [],
      copiedWorkflow: null,
      outputLogs: [],
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

  it("deletes selected nodes and connected edges", () => {
    const source = usePipelineStore.getState().addNode("MOCK_SOURCE", { x: 0, y: 0 });
    const sink = usePipelineStore.getState().addNode("CONSOLE_SINK", { x: 320, y: 0 });
    usePipelineStore.getState().connectNodes({
      source,
      target: sink,
      sourceHandle: "output",
      targetHandle: "input"
    });
    usePipelineStore.setState((state) => ({
      nodes: state.nodes.map((node) => (node.id === source ? { ...node, selected: true } : node))
    }));

    usePipelineStore.getState().deleteSelection();

    expect(usePipelineStore.getState().nodes.map((node) => node.id)).toEqual([sink]);
    expect(usePipelineStore.getState().edges).toHaveLength(0);
  });

  it("deletes a single edge without removing connected nodes", () => {
    const source = usePipelineStore.getState().addNode("MOCK_SOURCE", { x: 0, y: 0 });
    const sink = usePipelineStore.getState().addNode("CONSOLE_SINK", { x: 320, y: 0 });
    usePipelineStore.getState().connectNodes({
      source,
      target: sink,
      sourceHandle: "output",
      targetHandle: "input"
    });
    const edgeId = usePipelineStore.getState().edges[0]?.id;

    expect(edgeId).toBeDefined();
    usePipelineStore.getState().deleteEdge(edgeId ?? "");

    expect(usePipelineStore.getState().nodes).toHaveLength(2);
    expect(usePipelineStore.getState().edges).toHaveLength(0);
  });

  it("undoes and redoes graph edits", () => {
    usePipelineStore.getState().addNode("MOCK_SOURCE", { x: 0, y: 0 });
    expect(usePipelineStore.getState().nodes).toHaveLength(1);

    usePipelineStore.getState().undo();
    expect(usePipelineStore.getState().nodes).toHaveLength(0);

    usePipelineStore.getState().redo();
    expect(usePipelineStore.getState().nodes).toHaveLength(1);
  });

  it("copies and pastes selected workflow nodes", () => {
    const source = usePipelineStore.getState().addNode("MOCK_SOURCE", { x: 0, y: 0 });
    const sink = usePipelineStore.getState().addNode("CONSOLE_SINK", { x: 320, y: 0 });
    usePipelineStore.getState().connectNodes({
      source,
      target: sink,
      sourceHandle: "output",
      targetHandle: "input"
    });
    usePipelineStore.setState((state) => ({
      nodes: state.nodes.map((node) => ({ ...node, selected: true }))
    }));

    usePipelineStore.getState().copySelection();
    usePipelineStore.getState().pasteWorkflow();

    expect(usePipelineStore.getState().nodes).toHaveLength(4);
    expect(usePipelineStore.getState().edges).toHaveLength(2);
  });
});
