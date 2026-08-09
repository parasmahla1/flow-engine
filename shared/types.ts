export type JsonPrimitive = string | number | boolean | null;

export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export interface JsonObject {
  readonly [key: string]: JsonValue;
}

export type JsonArray = readonly JsonValue[];

export type HttpMethod = "GET" | "POST";

export type NodeKind =
  | "MOCK_SOURCE"
  | "HTTP_SOURCE"
  | "DELAY"
  | "JSON_FILTER"
  | "CONSOLE_SINK";

export type NodeCategory = "source" | "transformer" | "sink";

export type NodeStatus = "idle" | "processing" | "success" | "error";

export interface Position {
  x: number;
  y: number;
}

export interface MockSourceConfig {
  rowCount: number;
  intervalMs: number;
}

export interface HttpSourceConfig {
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  body: string;
}

export interface DelayConfig {
  delayMs: number;
}

export interface JsonFilterConfig {
  expression: string;
}

export interface ConsoleSinkConfig {
  prefix: string;
}

export type PipelineNodeConfig =
  | MockSourceConfig
  | HttpSourceConfig
  | DelayConfig
  | JsonFilterConfig
  | ConsoleSinkConfig;

export interface PipelineNodeData {
  label: string;
  kind: NodeKind;
  status: NodeStatus;
  config: PipelineNodeConfig;
  preview: JsonObject[];
}

export interface PipelineNode {
  id: string;
  type: "pipelineNode";
  kind: NodeKind;
  position: Position;
  data: PipelineNodeData;
}

export interface PipelineEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle: "output";
  targetHandle: "input";
}

export interface PipelineSchema {
  id?: string;
  name: string;
  nodes: PipelineNode[];
  edges: PipelineEdge[];
}

export interface AuthUser {
  id: string;
  username: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface NodeDefinition {
  kind: NodeKind;
  category: NodeCategory;
  label: string;
  description: string;
}

export interface ExecutionStartedPayload {
  executionId: string;
}

export interface NodeStatusChangedPayload {
  nodeId: string;
  status: Exclude<NodeStatus, "idle">;
  message?: string;
}

export interface DataFlowPayload {
  edgeId: string;
  chunkSize: number;
}

export interface NodeOutputPayload {
  nodeId: string;
  records: JsonObject[];
  emittedAt: string;
}

export interface ExecutionCompletedPayload {
  executionId: string;
  totalDuration: number;
  totalDataProcessed: number;
}

export interface ExecutionErrorPayload {
  executionId?: string;
  message: string;
  nodeId?: string;
}

export interface ClientToServerEvents {
  execute_pipeline: (payload: PipelineSchema) => void;
}

export interface ServerToClientEvents {
  execution_started: (payload: ExecutionStartedPayload) => void;
  node_status_changed: (payload: NodeStatusChangedPayload) => void;
  data_flow: (payload: DataFlowPayload) => void;
  node_output: (payload: NodeOutputPayload) => void;
  execution_completed: (payload: ExecutionCompletedPayload) => void;
  execution_error: (payload: ExecutionErrorPayload) => void;
}

export const nodeDefinitions: readonly NodeDefinition[] = [
  {
    kind: "MOCK_SOURCE",
    category: "source",
    label: "Mock Data Source",
    description: "Generates random JSON rows in 50-item chunks."
  },
  {
    kind: "HTTP_SOURCE",
    category: "source",
    label: "HTTP Source",
    description: "Fetches JSON from an external HTTP endpoint."
  },
  {
    kind: "DELAY",
    category: "transformer",
    label: "Delay Node",
    description: "Simulates processing latency before forwarding data."
  },
  {
    kind: "JSON_FILTER",
    category: "transformer",
    label: "JSON Filter",
    description: "Keeps records that match a JSONPath expression."
  },
  {
    kind: "CONSOLE_SINK",
    category: "sink",
    label: "Console Sink",
    description: "Writes processed records to the backend terminal."
  }
] as const;

export const defaultConfigForKind = (kind: NodeKind): PipelineNodeConfig => {
  switch (kind) {
    case "MOCK_SOURCE":
      return { rowCount: 100, intervalMs: 120 };
    case "HTTP_SOURCE":
      return { url: "https://api.github.com/events", method: "GET", headers: {}, body: "" };
    case "DELAY":
      return { delayMs: 500 };
    case "JSON_FILTER":
      return { expression: "$" };
    case "CONSOLE_SINK":
      return { prefix: "flowengine" };
  }
};

export const labelForKind = (kind: NodeKind): string =>
  nodeDefinitions.find((definition) => definition.kind === kind)?.label ?? kind;

export const isNodeKind = (value: string): value is NodeKind =>
  nodeDefinitions.some((definition) => definition.kind === value);
