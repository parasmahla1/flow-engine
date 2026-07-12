"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Clock, Database, Filter, Globe, TerminalSquare, type LucideIcon } from "lucide-react";
import type { NodeKind, NodeStatus, PipelineNodeData } from "@flowengine/shared";
import { canUseAsInput, canUseAsOutput } from "@/lib/graph";

const icons: Record<NodeKind, LucideIcon> = {
  MOCK_SOURCE: Database,
  HTTP_SOURCE: Globe,
  DELAY: Clock,
  JSON_FILTER: Filter,
  CONSOLE_SINK: TerminalSquare
};

const statusClasses: Record<NodeStatus, string> = {
  idle: "border-zinc-300 bg-white",
  processing: "border-sky-500 bg-sky-50 shadow-[0_0_0_4px_rgba(14,165,233,0.12)]",
  success: "border-emerald-500 bg-emerald-50",
  error: "border-red-500 bg-red-50"
};

const statusDotClasses: Record<NodeStatus, string> = {
  idle: "bg-zinc-400",
  processing: "bg-sky-500 animate-pulse",
  success: "bg-emerald-500",
  error: "bg-red-500"
};

export const PipelineNode = memo(({ data, selected }: NodeProps<PipelineNodeData>) => {
  const Icon = icons[data.kind];

  return (
    <div
      className={`relative min-h-[86px] w-[210px] rounded-md border px-3 py-3 shadow-sm transition ${statusClasses[data.status]} ${
        selected ? "ring-2 ring-teal-500" : ""
      }`}
    >
      {canUseAsInput(data.kind) ? (
        <Handle
          type="target"
          id="input"
          position={Position.Left}
          className="!border-white !bg-zinc-600"
        />
      ) : null}

      <div className="flex items-start gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-zinc-100 text-teal-700">
          <Icon size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-zinc-900">{data.label}</div>
          <div className="mt-2 flex items-center gap-2 text-xs font-medium capitalize text-zinc-500">
            <span className={`h-2 w-2 rounded-full ${statusDotClasses[data.status]}`} />
            {data.status}
          </div>
        </div>
      </div>

      {canUseAsOutput(data.kind) ? (
        <Handle
          type="source"
          id="output"
          position={Position.Right}
          className="!border-white !bg-teal-700"
        />
      ) : null}
    </div>
  );
});

PipelineNode.displayName = "PipelineNode";
