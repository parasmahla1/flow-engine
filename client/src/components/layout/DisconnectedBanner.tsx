"use client";

import { WifiOff } from "lucide-react";
import { usePipelineStore } from "@/store/pipelineStore";

export const DisconnectedBanner = () => {
  const connectionStatus = usePipelineStore((state) => state.connectionStatus);

  if (connectionStatus !== "disconnected") {
    return null;
  }

  return (
    <div className="flex h-9 shrink-0 items-center justify-center gap-2 border-b border-amber-200 bg-amber-50 text-xs font-medium text-amber-800">
      <WifiOff size={15} />
      Disconnected
    </div>
  );
};
