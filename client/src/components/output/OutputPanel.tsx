"use client";

import { useCallback, useState } from "react";
import { Terminal, Trash2 } from "lucide-react";
import { usePipelineStore } from "@/store/pipelineStore";

const minHeight = 120;
const maxHeight = 420;

export const OutputPanel = () => {
  const [height, setHeight] = useState(176);
  const outputLogs = usePipelineStore((state) => state.outputLogs);
  const clearOutput = usePipelineStore((state) => state.clearOutput);
  const startResize = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const startY = event.clientY;
      const startHeight = height;

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const nextHeight = startHeight + startY - moveEvent.clientY;
        setHeight(Math.min(maxHeight, Math.max(minHeight, nextHeight)));
      };

      const handlePointerUp = () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    },
    [height]
  );

  return (
    <section className="relative shrink-0 border-t border-zinc-300 bg-white" style={{ height }}>
      <div
        className="absolute -top-1 left-0 h-2 w-full cursor-row-resize bg-transparent"
        onPointerDown={startResize}
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize output panel"
        title="Resize output"
      >
        <div className="mx-auto mt-0.5 h-1 w-12 rounded-full bg-zinc-300" />
      </div>
      <div className="flex h-10 items-center justify-between border-b border-zinc-200 px-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800">
          <Terminal size={16} />
          Output
        </div>
        <button
          type="button"
          className="grid h-7 w-7 place-items-center rounded-md border border-zinc-300 bg-white text-zinc-600 transition hover:border-red-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={outputLogs.length === 0}
          onClick={clearOutput}
          aria-label="Clear output"
          title="Clear"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <div className="h-[calc(100%-2.5rem)] overflow-auto bg-zinc-950 p-3 font-mono text-xs leading-5 text-zinc-100">
        {outputLogs.length === 0 ? (
          <div className="text-zinc-500">[]</div>
        ) : (
          outputLogs.map((entry) => (
            <pre key={entry.id} className="mb-3 whitespace-pre-wrap border-b border-zinc-800 pb-3">
              {JSON.stringify(
                {
                  nodeId: entry.nodeId,
                  emittedAt: entry.emittedAt,
                  inputRecords: entry.inputRecords,
                  outputRecords: entry.records
                },
                null,
                2
              )}
            </pre>
          ))
        )}
      </div>
    </section>
  );
};
