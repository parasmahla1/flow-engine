"use client";

import { Clock3 } from "lucide-react";
import { usePipelineStore } from "@/store/pipelineStore";

const statusClass = {
  running: "bg-sky-50 text-sky-700",
  success: "bg-emerald-50 text-emerald-700",
  error: "bg-red-50 text-red-700",
  stopped: "bg-zinc-100 text-zinc-600"
};

export const RunHistoryPanel = () => {
  const runHistory = usePipelineStore((state) => state.runHistory);

  return (
    <section className="space-y-2 border-t border-zinc-300 pt-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-normal text-zinc-500">
        <Clock3 size={13} />
        Run History
      </div>

      <div className="max-h-56 space-y-2 overflow-auto">
        {runHistory.length === 0 ? (
          <div className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-500">
            No runs yet
          </div>
        ) : (
          runHistory.map((run) => (
            <div key={run.executionId} className="rounded-md border border-zinc-300 bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-semibold text-zinc-800">
                  {new Date(run.startedAt).toLocaleTimeString()}
                </span>
                <span className={`rounded-md px-2 py-1 text-xs font-semibold ${statusClass[run.status]}`}>
                  {run.status}
                </span>
              </div>
              <div className="mt-2 space-y-1 text-xs text-zinc-500">
                {typeof run.durationMs === "number" ? <div>{run.durationMs}ms</div> : null}
                {typeof run.totalDataProcessed === "number" ? (
                  <div>{run.totalDataProcessed} records</div>
                ) : null}
                {run.error ? <div className="text-red-600">{run.error}</div> : null}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};
