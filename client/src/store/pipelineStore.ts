import {
  MarkerType,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type XYPosition
} from "reactflow";
import { create } from "zustand";
import type {
  JsonObject,
  NodeKind,
  NodeOutputPayload,
  NodeStatus,
  PipelineEdge,
  PipelineNode,
  PipelineNodeConfig,
  PipelineNodeData,
  PipelineSchema
} from "@flowengine/shared";
import { defaultConfigForKind, labelForKind } from "@flowengine/shared";
import { canConnectKinds, wouldCreateCycle } from "../lib/graph";

export interface FlowEdgeData {
  flowNonce?: number;
  chunkSize?: number;
}

export type FlowNode = Node<PipelineNodeData, "pipelineNode">;
export type FlowEdge = Edge<FlowEdgeData>;

interface GraphSnapshot {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

interface CopiedWorkflow {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface OutputLogEntry extends NodeOutputPayload {
  id: string;
}

export interface NodeInspectorSnapshot {
  input: JsonObject[];
  output: JsonObject[];
  updatedAt: string;
}

export type RunHistoryStatus = "running" | "success" | "error" | "stopped";

export interface RunHistoryEntry {
  executionId: string;
  status: RunHistoryStatus;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  totalDataProcessed?: number;
  error?: string;
}

interface PipelineState {
  pipelineId: string | null;
  pipelineName: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  historyPast: GraphSnapshot[];
  historyFuture: GraphSnapshot[];
  copiedWorkflow: CopiedWorkflow | null;
  outputLogs: OutputLogEntry[];
  nodeInspector: Record<string, NodeInspectorSnapshot>;
  runHistory: RunHistoryEntry[];
  selectedNodeId: string | null;
  isRunning: boolean;
  connectionStatus: "connecting" | "connected" | "disconnected";
  lastExecutionId: string | null;
  lastError: string | null;
  setPipelineName: (name: string) => void;
  addNode: (kind: NodeKind, position: XYPosition) => string;
  selectNode: (nodeId: string | null) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  connectNodes: (connection: Connection) => boolean;
  deleteEdge: (edgeId: string) => void;
  deleteSelection: () => void;
  copySelection: () => void;
  pasteWorkflow: () => void;
  undo: () => void;
  redo: () => void;
  updateNodeConfig: (nodeId: string, config: PipelineNodeConfig) => void;
  setNodeStatus: (nodeId: string, status: NodeStatus) => void;
  triggerFlow: (edgeId: string, chunkSize: number) => void;
  appendNodeOutput: (payload: NodeOutputPayload) => void;
  clearOutput: () => void;
  startExecution: (executionId: string) => void;
  finishExecution: (summary?: { totalDuration: number; totalDataProcessed: number }) => void;
  failExecution: (message: string) => void;
  stopLocalExecution: () => void;
  setConnectionStatus: (status: PipelineState["connectionStatus"]) => void;
  loadPipeline: (pipeline: PipelineSchema) => void;
  toPipelineSchema: () => PipelineSchema;
}

const historyLimit = 60;

const snapshotGraph = (state: Pick<PipelineState, "nodes" | "edges">): GraphSnapshot => ({
  nodes: state.nodes,
  edges: state.edges
});

const withHistory = (
  state: PipelineState,
  graph: Pick<PipelineState, "nodes" | "edges"> & Partial<Pick<PipelineState, "selectedNodeId">>
) => ({
  ...graph,
  historyPast: [...state.historyPast, snapshotGraph(state)].slice(-historyLimit),
  historyFuture: []
});

const createFlowNode = (kind: NodeKind, position: XYPosition): FlowNode => {
  const id = crypto.randomUUID();

  return {
    id,
    type: "pipelineNode",
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

const createFlowEdge = (source: string, target: string): FlowEdge => ({
  id: `${source}-${target}-${crypto.randomUUID()}`,
  source,
  target,
  sourceHandle: "output",
  targetHandle: "input",
  type: "particle",
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 18,
    height: 18,
    color: "#0f766e"
  },
  style: {
    stroke: "#0f766e",
    strokeWidth: 2
  }
});

const fromPipelineNode = (node: PipelineNode): FlowNode => ({
  id: node.id,
  type: "pipelineNode",
  position: node.position,
  data: node.data
});

const fromPipelineEdge = (edge: PipelineEdge): FlowEdge => ({
  id: edge.id,
  source: edge.source,
  target: edge.target,
  sourceHandle: "output",
  targetHandle: "input",
  type: "particle",
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 18,
    height: 18,
    color: "#0f766e"
  },
  style: {
    stroke: "#0f766e",
    strokeWidth: 2
  }
});

const toPipelineNode = (node: FlowNode): PipelineNode => ({
  id: node.id,
  type: "pipelineNode",
  kind: node.data.kind,
  position: node.position,
  data: {
    ...node.data,
    status: "idle"
  }
});

const toPipelineEdge = (edge: FlowEdge): PipelineEdge => ({
  id: edge.id,
  source: edge.source,
  target: edge.target,
  sourceHandle: "output",
  targetHandle: "input"
});

export const usePipelineStore = create<PipelineState>((set, get) => ({
  pipelineId: null,
  pipelineName: "Untitled pipeline",
  nodes: [],
  edges: [],
  historyPast: [],
  historyFuture: [],
  copiedWorkflow: null,
  outputLogs: [],
  nodeInspector: {},
  runHistory: [],
  selectedNodeId: null,
  isRunning: false,
  connectionStatus: "connecting",
  lastExecutionId: null,
  lastError: null,
  setPipelineName: (pipelineName) => set({ pipelineName }),
  addNode: (kind, position) => {
    const node = createFlowNode(kind, position);
    set((state) => withHistory(state, { nodes: [...state.nodes, node], edges: state.edges }));
    return node.id;
  },
  selectNode: (selectedNodeId) => set({ selectedNodeId }),
  onNodesChange: (changes) =>
    set((state) => {
      const nodes = applyNodeChanges<PipelineNodeData>(changes, state.nodes) as FlowNode[];
      const selectionOnly = changes.every((change) => change.type === "select");
      const removedNodeIds = new Set(
        changes.flatMap((change) => (change.type === "remove" ? [change.id] : []))
      );
      const edges =
        removedNodeIds.size > 0
          ? state.edges.filter(
              (edge) => !removedNodeIds.has(edge.source) && !removedNodeIds.has(edge.target)
            )
          : state.edges;

      return selectionOnly ? { nodes } : withHistory(state, { nodes, edges });
    }),
  onEdgesChange: (changes) =>
    set((state) => {
      const edges = applyEdgeChanges<FlowEdgeData>(changes, state.edges);
      const selectionOnly = changes.every((change) => change.type === "select");

      return selectionOnly ? { edges } : withHistory(state, { nodes: state.nodes, edges });
    }),
  connectNodes: (connection) => {
    if (
      !connection.source ||
      !connection.target ||
      connection.source === connection.target ||
      connection.sourceHandle !== "output" ||
      connection.targetHandle !== "input"
    ) {
      return false;
    }

    const state = get();
    const sourceNode = state.nodes.find((node) => node.id === connection.source);
    const targetNode = state.nodes.find((node) => node.id === connection.target);

    if (!sourceNode || !targetNode || !canConnectKinds(sourceNode.data.kind, targetNode.data.kind)) {
      return false;
    }

    const candidateEdge = createFlowEdge(connection.source, connection.target);

    if (wouldCreateCycle(state.nodes, [...state.edges, candidateEdge])) {
      return false;
    }

    set(withHistory(state, { nodes: state.nodes, edges: addEdge(candidateEdge, state.edges) }));
    return true;
  },
  deleteEdge: (edgeId) =>
    set((state) => {
      if (!state.edges.some((edge) => edge.id === edgeId)) {
        return {};
      }

      return withHistory(state, {
        nodes: state.nodes,
        edges: state.edges.filter((edge) => edge.id !== edgeId)
      });
    }),
  deleteSelection: () =>
    set((state) => {
      const selectedNodeIds = new Set(
        state.nodes
          .filter((node) => node.selected || node.id === state.selectedNodeId)
          .map((node) => node.id)
      );
      const selectedEdgeIds = new Set(
        state.edges.filter((edge) => edge.selected).map((edge) => edge.id)
      );

      if (selectedNodeIds.size === 0 && selectedEdgeIds.size === 0) {
        return {};
      }

      return withHistory(state, {
        nodes: state.nodes.filter((node) => !selectedNodeIds.has(node.id)),
        edges: state.edges.filter(
          (edge) =>
            !selectedEdgeIds.has(edge.id) &&
            !selectedNodeIds.has(edge.source) &&
            !selectedNodeIds.has(edge.target)
        ),
        selectedNodeId: null
      });
    }),
  copySelection: () =>
    set((state) => {
      const selectedNodes = state.nodes.filter((node) => node.selected || node.id === state.selectedNodeId);
      const selectedNodeIds = new Set(selectedNodes.map((node) => node.id));

      if (selectedNodes.length === 0) {
        return {};
      }

      return {
        copiedWorkflow: {
          nodes: selectedNodes,
          edges: state.edges.filter(
            (edge) => selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target)
          )
        }
      };
    }),
  pasteWorkflow: () =>
    set((state) => {
      if (!state.copiedWorkflow) {
        return {};
      }

      const idMap = new Map<string, string>();
      const nodes = state.copiedWorkflow.nodes.map((node) => {
        const id = crypto.randomUUID();
        idMap.set(node.id, id);

        return {
          ...node,
          id,
          selected: true,
          position: {
            x: node.position.x + 44,
            y: node.position.y + 44
          },
          data: {
            ...node.data,
            status: "idle" as const,
            preview: []
          }
        };
      });
      const edges = state.copiedWorkflow.edges.flatMap((edge) => {
        const source = idMap.get(edge.source);
        const target = idMap.get(edge.target);

        if (!source || !target) {
          return [];
        }

        return [
          {
            ...edge,
            id: `${source}-${target}-${crypto.randomUUID()}`,
            source,
            target,
            selected: true
          }
        ];
      });

      return withHistory(state, {
        nodes: [...state.nodes.map((node) => ({ ...node, selected: false })), ...nodes],
        edges: [...state.edges.map((edge) => ({ ...edge, selected: false })), ...edges],
        selectedNodeId: nodes[0]?.id ?? null
      });
    }),
  undo: () =>
    set((state) => {
      const previous = state.historyPast[state.historyPast.length - 1];

      if (!previous) {
        return {};
      }

      return {
        nodes: previous.nodes,
        edges: previous.edges,
        historyPast: state.historyPast.slice(0, -1),
        historyFuture: [snapshotGraph(state), ...state.historyFuture].slice(0, historyLimit),
        selectedNodeId: null
      };
    }),
  redo: () =>
    set((state) => {
      const next = state.historyFuture[0];

      if (!next) {
        return {};
      }

      return {
        nodes: next.nodes,
        edges: next.edges,
        historyPast: [...state.historyPast, snapshotGraph(state)].slice(-historyLimit),
        historyFuture: state.historyFuture.slice(1),
        selectedNodeId: null
      };
    }),
  updateNodeConfig: (nodeId, config) =>
    set((state) =>
      withHistory(state, {
        nodes: state.nodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  config
                }
              }
            : node
        ),
        edges: state.edges
      })
    ),
  setNodeStatus: (nodeId, status) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                status
              }
            }
          : node
      )
    })),
  triggerFlow: (edgeId, chunkSize) =>
    set((state) => {
      const edge = state.edges.find((item) => item.id === edgeId);
      const targetId = edge?.target;
      const previewRecord: JsonObject = {
        edgeId,
        chunkSize,
        receivedAt: new Date().toISOString()
      };

      return {
        edges: state.edges.map((item) =>
          item.id === edgeId
            ? {
                ...item,
                data: {
                  ...item.data,
                  flowNonce: Date.now(),
                  chunkSize
                }
              }
            : item
        ),
        nodes: state.nodes.map((node) =>
          node.id === targetId
            ? {
                ...node,
                data: {
                  ...node.data,
                  preview: [previewRecord, ...node.data.preview].slice(0, 5)
                }
              }
            : node
        )
      };
    }),
  appendNodeOutput: (payload) =>
    set((state) => {
      const entry: OutputLogEntry = {
        ...payload,
        id: `${payload.nodeId}-${payload.emittedAt}-${crypto.randomUUID()}`
      };

      return {
        outputLogs: [entry, ...state.outputLogs].slice(0, 100),
        nodes: state.nodes.map((node) =>
          node.id === payload.nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  preview: payload.records.slice(-5)
                }
              }
            : node
        ),
        nodeInspector: {
          ...state.nodeInspector,
          [payload.nodeId]: {
            input: payload.inputRecords,
            output: payload.records,
            updatedAt: payload.emittedAt
          }
        }
      };
    }),
  clearOutput: () => set({ outputLogs: [] }),
  startExecution: (lastExecutionId) =>
    set((state) => ({
      lastExecutionId,
      isRunning: true,
      lastError: null,
      outputLogs: [],
      nodeInspector: {},
      runHistory: [
        {
          executionId: lastExecutionId,
          status: "running" as const,
          startedAt: new Date().toISOString()
        },
        ...state.runHistory
      ].slice(0, 25),
      nodes: state.nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          status: "idle",
          preview: []
        }
      }))
    })),
  finishExecution: (summary) =>
    set((state) => ({
      isRunning: false,
      runHistory: state.runHistory.map((entry, index) =>
        index === 0 && entry.status === "running"
          ? {
              ...entry,
              status: "success",
              completedAt: new Date().toISOString(),
              ...(summary
                ? {
                    durationMs: summary.totalDuration,
                    totalDataProcessed: summary.totalDataProcessed
                  }
                : {})
            }
          : entry
      )
    })),
  failExecution: (lastError) =>
    set((state) => ({
      lastError,
      isRunning: false,
      runHistory: state.runHistory.map((entry, index) =>
        index === 0 && entry.status === "running"
          ? {
              ...entry,
              status: "error",
              completedAt: new Date().toISOString(),
              error: lastError
            }
          : entry
      )
    })),
  stopLocalExecution: () =>
    set((state) => ({
      isRunning: false,
      runHistory: state.runHistory.map((entry, index) =>
        index === 0 && entry.status === "running"
          ? {
              ...entry,
              status: "stopped",
              completedAt: new Date().toISOString()
            }
          : entry
      ),
      nodes: state.nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          status: node.data.status === "processing" ? "idle" : node.data.status
        }
      }))
    })),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  loadPipeline: (pipeline) =>
    set({
      pipelineId: pipeline.id ?? null,
      pipelineName: pipeline.name,
      nodes: pipeline.nodes.map(fromPipelineNode),
      edges: pipeline.edges.map(fromPipelineEdge),
      historyPast: [],
      historyFuture: [],
      outputLogs: [],
      nodeInspector: {},
      selectedNodeId: null,
      lastError: null
    }),
  toPipelineSchema: () => {
    const state = get();

    return {
      ...(state.pipelineId ? { id: state.pipelineId } : {}),
      name: state.pipelineName,
      nodes: state.nodes.map(toPipelineNode),
      edges: state.edges.map(toPipelineEdge)
    };
  }
}));
