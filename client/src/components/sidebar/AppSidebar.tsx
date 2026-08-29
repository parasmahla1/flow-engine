"use client";

"use client";

import { CommandPalette } from "./CommandPalette";
import { NodePalette } from "./NodePalette";
import { PipelineDashboard } from "./PipelineDashboard";
import { PipelineTemplates } from "./PipelineTemplates";
import { RunHistoryPanel } from "./RunHistoryPanel";
import { ValidationPanel } from "./ValidationPanel";

export const AppSidebar = () => (
  <aside className="flex w-[250px] shrink-0 flex-col gap-5 overflow-y-auto border-r border-zinc-300 bg-zinc-50 p-4">
    <CommandPalette />
    <NodePalette />
    <PipelineTemplates />
    <ValidationPanel />
    <RunHistoryPanel />
    <PipelineDashboard />
  </aside>
);
