"use client";

import { Boxes, Wand2 } from "lucide-react";
import { buildPipelineFromTemplate, pipelineTemplates } from "@/lib/pipelineTemplates";
import { usePipelineStore } from "@/store/pipelineStore";

export const PipelineTemplates = () => {
  const isRunning = usePipelineStore((state) => state.isRunning);
  const replaceWorkflow = usePipelineStore((state) => state.replaceWorkflow);

  return (
    <section className="space-y-2 border-t border-zinc-300 pt-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-normal text-zinc-500">
        <Boxes size={13} />
        Templates
      </div>
      <div className="space-y-2">
        {pipelineTemplates.map((template) => (
          <button
            key={template.id}
            type="button"
            disabled={isRunning}
            className="flex w-full items-start gap-3 rounded-md border border-zinc-300 bg-white p-3 text-left shadow-sm transition hover:border-teal-600 hover:shadow-panel disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => replaceWorkflow(buildPipelineFromTemplate(template))}
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-zinc-100 text-teal-700">
              <Wand2 size={16} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold leading-5 text-zinc-900">{template.name}</span>
              <span className="mt-1 block text-xs leading-5 text-zinc-500">{template.description}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};
