"use client";

import { Activity, Clock, Database, Filter, Globe, TerminalSquare, type LucideIcon } from "lucide-react";
import type { DragEvent } from "react";
import type { NodeCategory, NodeKind } from "@flowengine/shared";
import { nodeDefinitions } from "@flowengine/shared";

const categories: readonly NodeCategory[] = ["source", "transformer", "sink"];

const categoryLabels: Record<NodeCategory, string> = {
  source: "Sources",
  transformer: "Transformers",
  sink: "Sinks"
};

const icons: Record<NodeKind, LucideIcon> = {
  MOCK_SOURCE: Database,
  HTTP_SOURCE: Globe,
  DELAY: Clock,
  JSON_FILTER: Filter,
  CONSOLE_SINK: TerminalSquare
};

const handleDragStart = (event: DragEvent<HTMLButtonElement>, kind: NodeKind) => {
  event.dataTransfer.setData("application/flowengine-node", kind);
  event.dataTransfer.effectAllowed = "move";
};

export const NodePalette = () => (
  <div className="space-y-5">
    {categories.map((category) => (
      <section key={category} className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-normal text-zinc-500">
          <Activity size={13} />
          {categoryLabels[category]}
        </div>
        <div className="space-y-2">
          {nodeDefinitions
            .filter((definition) => definition.category === category)
            .map((definition) => {
              const Icon = icons[definition.kind];

              return (
                <button
                  key={definition.kind}
                  type="button"
                  draggable
                  onDragStart={(event) => handleDragStart(event, definition.kind)}
                  className="flex w-full items-start gap-3 rounded-md border border-zinc-300 bg-white p-3 text-left shadow-sm transition hover:border-teal-600 hover:shadow-panel"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-zinc-100 text-teal-700">
                    <Icon size={17} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-zinc-900">{definition.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-zinc-500">{definition.description}</span>
                  </span>
                </button>
              );
            })}
        </div>
      </section>
    ))}
  </div>
);
