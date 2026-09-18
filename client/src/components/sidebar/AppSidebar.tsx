"use client";

import { Layers3 } from "lucide-react";
import { CommandPalette } from "./CommandPalette";
import { NodePalette } from "./NodePalette";
import { PipelineDashboard } from "./PipelineDashboard";
import { PipelineTemplates } from "./PipelineTemplates";
import { RunHistoryPanel } from "./RunHistoryPanel";
import { ValidationPanel } from "./ValidationPanel";

export const AppSidebar = () => (
  <aside className="app-sidebar flex w-[258px] shrink-0 flex-col gap-5 overflow-y-auto border-r border-zinc-300 bg-zinc-50 p-4">
    <div className="app-sidebar-heading">
      <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900"><Layers3 size={16} className="text-teal-700" /> Pipeline studio</div>
      <p>Compose and inspect your workflow</p>
    </div>
    <CommandPalette />
    <NodePalette />
    <PipelineTemplates />
    <ValidationPanel />
    <RunHistoryPanel />
    <PipelineDashboard />
  </aside>
);
