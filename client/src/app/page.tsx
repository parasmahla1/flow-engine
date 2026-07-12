"use client";

import { ReactFlowProvider } from "reactflow";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { PipelineCanvas } from "@/components/canvas/PipelineCanvas";
import { NodeConfigPanel } from "@/components/config/NodeConfigPanel";
import { TopBar } from "@/components/layout/TopBar";
import { DisconnectedBanner } from "@/components/layout/DisconnectedBanner";
import { usePipelineExecution } from "@/hooks/usePipelineExecution";

const FlowWorkspace = () => {
  const { runPipeline, stopLocalExecution } = usePipelineExecution();

  return (
    <main className="flex h-screen min-h-0 flex-col bg-zinc-100 text-zinc-950">
      <TopBar onRun={runPipeline} onStop={stopLocalExecution} />
      <DisconnectedBanner />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <AppSidebar />
        <PipelineCanvas />
        <NodeConfigPanel />
      </div>
    </main>
  );
};

export default function Page() {
  return (
    <ReactFlowProvider>
      <FlowWorkspace />
    </ReactFlowProvider>
  );
}
