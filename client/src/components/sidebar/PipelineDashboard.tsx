"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import type { PipelineSchema } from "@flowengine/shared";
import { listPipelines } from "@/lib/api";
import { usePipelineStore } from "@/store/pipelineStore";

export const PipelineDashboard = () => {
  const [pipelines, setPipelines] = useState<PipelineSchema[]>([]);
  const [loading, setLoading] = useState(false);
  const loadPipeline = usePipelineStore((state) => state.loadPipeline);

  const refresh = async () => {
    setLoading(true);

    try {
      setPipelines(await listPipelines());
    } catch {
      setPipelines([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <section className="space-y-2 border-t border-zinc-300 pt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-normal text-zinc-500">Saved</h2>
        <button
          type="button"
          className="grid h-7 w-7 place-items-center rounded-md border border-zinc-300 bg-white text-zinc-600 transition hover:border-teal-600 hover:text-teal-700"
          onClick={() => void refresh()}
          aria-label="Refresh saved pipelines"
          title="Refresh"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="space-y-2">
        {pipelines.map((pipeline) => (
          <button
            key={pipeline.id ?? pipeline.name}
            type="button"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-left text-sm font-medium text-zinc-800 transition hover:border-teal-600"
            onClick={() => loadPipeline(pipeline)}
          >
            {pipeline.name}
          </button>
        ))}
      </div>
    </section>
  );
};
