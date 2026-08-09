"use client";

import {
  ClipboardPaste,
  Copy,
  LogOut,
  Play,
  Redo2,
  Save,
  Square,
  Trash2,
  Undo2
} from "lucide-react";
import { useState } from "react";
import { savePipeline } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { usePipelineStore } from "@/store/pipelineStore";

interface TopBarProps {
  onRun: () => void;
  onStop: () => void;
}

export const TopBar = ({ onRun, onStop }: TopBarProps) => {
  const [saving, setSaving] = useState(false);
  const pipelineName = usePipelineStore((state) => state.pipelineName);
  const isRunning = usePipelineStore((state) => state.isRunning);
  const nodes = usePipelineStore((state) => state.nodes);
  const edges = usePipelineStore((state) => state.edges);
  const historyPast = usePipelineStore((state) => state.historyPast);
  const historyFuture = usePipelineStore((state) => state.historyFuture);
  const copiedWorkflow = usePipelineStore((state) => state.copiedWorkflow);
  const lastError = usePipelineStore((state) => state.lastError);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const setPipelineName = usePipelineStore((state) => state.setPipelineName);
  const loadPipeline = usePipelineStore((state) => state.loadPipeline);
  const toPipelineSchema = usePipelineStore((state) => state.toPipelineSchema);
  const failExecution = usePipelineStore((state) => state.failExecution);
  const undo = usePipelineStore((state) => state.undo);
  const redo = usePipelineStore((state) => state.redo);
  const copySelection = usePipelineStore((state) => state.copySelection);
  const pasteWorkflow = usePipelineStore((state) => state.pasteWorkflow);
  const deleteSelection = usePipelineStore((state) => state.deleteSelection);
  const hasSelection = nodes.some((node) => node.selected) || edges.some((edge) => edge.selected);

  const handleSave = async () => {
    setSaving(true);

    try {
      const saved = await savePipeline(toPipelineSchema());
      loadPipeline(saved);
    } catch (error) {
      failExecution(error instanceof Error ? error.message : "Unable to save pipeline.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-zinc-300 bg-white px-4">
      <div className="flex h-9 items-center gap-2 border-r border-zinc-300 pr-4">
        <div className="grid h-8 w-8 place-items-center rounded-md bg-teal-700 text-sm font-semibold text-white">
          FE
        </div>
        <span className="text-sm font-semibold tracking-normal text-zinc-900">FlowEngine</span>
      </div>

      <input
        aria-label="Pipeline name"
        className="h-9 min-w-0 flex-1 rounded-md border border-zinc-300 bg-zinc-50 px-3 text-sm font-medium outline-none transition focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-100"
        value={pipelineName}
        onChange={(event) => setPipelineName(event.target.value)}
      />

      {lastError ? (
        <div className="max-w-sm truncate rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {lastError}
        </div>
      ) : null}

      <div className="flex h-9 items-center gap-1 border-l border-zinc-300 pl-3">
        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded-md border border-zinc-300 bg-white text-zinc-700 shadow-sm transition hover:border-teal-600 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={historyPast.length === 0}
          onClick={undo}
          aria-label="Undo"
          title="Undo"
        >
          <Undo2 size={16} />
        </button>
        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded-md border border-zinc-300 bg-white text-zinc-700 shadow-sm transition hover:border-teal-600 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={historyFuture.length === 0}
          onClick={redo}
          aria-label="Redo"
          title="Redo"
        >
          <Redo2 size={16} />
        </button>
        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded-md border border-zinc-300 bg-white text-zinc-700 shadow-sm transition hover:border-teal-600 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!hasSelection}
          onClick={copySelection}
          aria-label="Copy"
          title="Copy"
        >
          <Copy size={16} />
        </button>
        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded-md border border-zinc-300 bg-white text-zinc-700 shadow-sm transition hover:border-teal-600 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!copiedWorkflow}
          onClick={pasteWorkflow}
          aria-label="Paste"
          title="Paste"
        >
          <ClipboardPaste size={16} />
        </button>
        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded-md border border-zinc-300 bg-white text-zinc-700 shadow-sm transition hover:border-red-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!hasSelection}
          onClick={deleteSelection}
          aria-label="Delete"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <button
        type="button"
        className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-800 shadow-sm transition hover:border-teal-600 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={saving}
        onClick={() => void handleSave()}
      >
        <Save size={16} />
        {saving ? "Saving" : "Save"}
      </button>

      <button
        type="button"
        className="inline-flex h-9 items-center gap-2 rounded-md bg-teal-700 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isRunning}
        onClick={onRun}
      >
        <Play size={16} fill="currentColor" />
        Run
      </button>

      <button
        type="button"
        className="grid h-9 w-9 place-items-center rounded-md border border-zinc-300 bg-white text-zinc-700 shadow-sm transition hover:border-red-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!isRunning}
        onClick={onStop}
        aria-label="Stop"
        title="Stop"
      >
        <Square size={16} fill="currentColor" />
      </button>

      <div className="flex h-9 items-center gap-2 border-l border-zinc-300 pl-3">
        <span className="max-w-28 truncate text-xs font-medium text-zinc-600">{user?.username}</span>
        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded-md border border-zinc-300 bg-white text-zinc-700 shadow-sm transition hover:border-teal-600 hover:text-teal-700"
          onClick={logout}
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};
