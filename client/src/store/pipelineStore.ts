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

interface PipelineState {
  pipelineId: string | null;
  pipelineName: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
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
  updateNodeConfig: (nodeId: string, config: PipelineNodeConfig) => void;
  setNodeStatus: (nodeId: string, status: NodeStatus) => void;
  triggerFlow: (edgeId: string, chunkSize: number) => void;
  startExecution: (executionId: string) => void;
  finishExecution: () => void;
  failExecution: (message: string) => void;
  stopLocalExecution: () => void;
  setConnectionStatus: (status: PipelineState["connectionStatus"]) => void;
  loadPipeline: (pipeline: PipelineSchema) => void;
  toPipelineSchema: () => PipelineSchema;
}

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
  selectedNodeId: null,
  isRunning: false,
  connectionStatus: "connecting",
  lastExecutionId: null,
  lastError: null,
  setPipelineName: (pipelineName) => set({ pipelineName }),
  addNode: (kind, position) => {
    const node = createFlowNode(kind, position);
    set((state) => ({ nodes: [...state.nodes, node] }));
    return node.id;
  },
  selectNode: (selectedNodeId) => set({ selectedNodeId }),
  onNodesChange: (changes) =>
    set((state) => ({
      nodes: applyNodeChanges<PipelineNodeData>(changes, state.nodes) as FlowNode[]
    })),
  onEdgesChange: (changes) =>
    set((state) => ({
      edges: applyEdgeChanges<FlowEdgeData>(changes, state.edges)
    })),
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

    set({
      edges: addEdge(candidateEdge, state.edges)
    });
    return true;
  },
  updateNodeConfig: (nodeId, config) =>
    set((state) => ({
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
      )
    })),
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
  startExecution: (lastExecutionId) =>
    set((state) => ({
      lastExecutionId,
      isRunning: true,
      lastError: null,
      nodes: state.nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          status: "idle",
          preview: []
        }
      }))
    })),
  finishExecution: () => set({ isRunning: false }),
  failExecution: (lastError) => set({ lastError, isRunning: false }),
  stopLocalExecution: () =>
    set((state) => ({
      isRunning: false,
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
