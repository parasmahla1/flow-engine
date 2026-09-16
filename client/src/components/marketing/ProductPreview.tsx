"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, Circle, Database, Filter, Play, TerminalSquare } from "lucide-react";

const nodes = [
  { label: "Mock source", type: "SOURCE", icon: Database, color: "teal" },
  { label: "JSON filter", type: "TRANSFORM", icon: Filter, color: "violet" },
  { label: "Console sink", type: "SINK", icon: TerminalSquare, color: "amber" }
] as const;

export const ProductPreview = () => {
  const [activeNode, setActiveNode] = useState(0);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveNode((current) => (current + 1) % nodes.length);
    }, 1800);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="preview-window" aria-label="Interactive FlowEngine pipeline preview">
      <div className="preview-toolbar">
        <div className="flex items-center gap-2">
          <span className="window-dot bg-[#ef6a5b]" />
          <span className="window-dot bg-[#f3bf4f]" />
          <span className="window-dot bg-[#61c454]" />
        </div>
        <div className="preview-path">workspace / orders-pipeline</div>
        <div className="preview-status"><Circle size={8} fill="currentColor" /> live</div>
      </div>

      <div className="preview-body">
        <aside className="preview-sidebar">
          <div className="preview-brand"><span>F</span> FlowEngine</div>
          <div className="preview-side-label">Workspace</div>
          <div className="preview-side-item active">Pipelines <span>04</span></div>
          <div className="preview-side-item">Runs <span>18</span></div>
          <div className="preview-side-item">Connections</div>
          <div className="mt-auto border-t border-white/10 pt-4 text-[10px] text-white/45">Personal workspace</div>
        </aside>

        <div className="preview-canvas">
          <div className="preview-canvas-head">
            <div>
              <p className="preview-eyebrow">Pipeline / Active</p>
              <h3>Orders enrichment</h3>
            </div>
            <button className="preview-run" type="button" onClick={() => setRunning((value) => !value)}>
              <Play size={11} fill="currentColor" /> {running ? "Running" : "Run pipeline"}
            </button>
          </div>

          <div className="preview-graph">
            <div className="preview-grid" />
            <div className="preview-flow-line line-one" />
            <div className="preview-flow-line line-two" />
            {nodes.map((node, index) => {
              const Icon = node.icon;
              const status = running && activeNode === index ? "processing" : index < activeNode ? "done" : "idle";

              return (
                <button
                  type="button"
                  className={`preview-node node-${index} ${status}`}
                  key={node.label}
                  onClick={() => setActiveNode(index)}
                >
                  <span className={`preview-node-icon ${node.color}`}><Icon size={14} /></span>
                  <span className="min-w-0 text-left">
                    <span className="block truncate text-[11px] font-semibold text-white">{node.label}</span>
                    <span className="mt-1 block text-[9px] uppercase tracking-[.12em] text-white/45">{node.type}</span>
                  </span>
                  <span className={`preview-node-state ${status}`}>
                    {status === "done" ? <Check size={9} /> : status === "processing" ? "•••" : ""}
                  </span>
                </button>
              );
            })}
            <div className="preview-events">
              <div className="flex items-center justify-between text-[10px] text-white/50"><span>Latest output</span><span>just now</span></div>
              <div className="mt-2 flex items-center gap-2 text-[10px] text-white/80"><span className="h-1.5 w-1.5 rounded-full bg-[#58c9a3]" /> 42 records processed</div>
              <div className="mt-1.5 flex items-center gap-2 text-[10px] text-white/50"><ArrowRight size={10} /> Filter matched `status: paid`</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
