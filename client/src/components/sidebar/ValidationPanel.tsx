"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { validateWorkflow } from "@/lib/pipelineValidation";
import { usePipelineStore } from "@/store/pipelineStore";

export const ValidationPanel = () => {
  const nodes = usePipelineStore((state) => state.nodes);
  const edges = usePipelineStore((state) => state.edges);
  const selectNode = usePipelineStore((state) => state.selectNode);
  const validation = validateWorkflow(nodes, edges);

  return (
    <section className="space-y-2 border-t border-zinc-300 pt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-normal text-zinc-500">Validation</h2>
        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${
            validation.isReady
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {validation.isReady ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
          {validation.isReady ? "Ready" : "Blocked"}
        </span>
      </div>

      <div className="max-h-44 space-y-2 overflow-auto">
        {validation.issues.length === 0 ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
            Ready to run
          </div>
        ) : (
          validation.issues.map((issue) => (
            <button
              key={issue.id}
              type="button"
              className={`w-full rounded-md border px-3 py-2 text-left text-xs leading-5 transition ${
                issue.severity === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-amber-200 bg-amber-50 text-amber-800"
              } ${issue.nodeId ? "hover:border-teal-600" : ""}`}
              onClick={() => {
                if (issue.nodeId) {
                  selectNode(issue.nodeId);
                }
              }}
            >
              {issue.message}
            </button>
          ))
        )}
      </div>
    </section>
  );
};
