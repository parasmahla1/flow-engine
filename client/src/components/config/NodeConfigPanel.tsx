"use client";

import type { ReactNode } from "react";
import type {
  ConsoleSinkConfig,
  DelayConfig,
  HttpSourceConfig,
  JsonFilterConfig,
  MockSourceConfig,
  PipelineNodeConfig
} from "@flowengine/shared";
import { usePipelineStore } from "@/store/pipelineStore";

const numberValue = (value: string): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

interface FieldProps {
  label: string;
  children: ReactNode;
}

const Field = ({ label, children }: FieldProps) => (
  <label className="block space-y-1.5">
    <span className="text-xs font-semibold uppercase tracking-normal text-zinc-500">{label}</span>
    {children}
  </label>
);

const inputClass =
  "h-9 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500";

const textareaClass =
  "min-h-24 w-full resize-none rounded-md border border-zinc-300 bg-white p-3 font-mono text-xs outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500";

export const NodeConfigPanel = () => {
  const selectedNodeId = usePipelineStore((state) => state.selectedNodeId);
  const selectedNode = usePipelineStore((state) =>
    state.nodes.find((node) => node.id === selectedNodeId)
  );
  const updateNodeConfig = usePipelineStore((state) => state.updateNodeConfig);
  const isRunning = usePipelineStore((state) => state.isRunning);
  const inspector = usePipelineStore((state) =>
    selectedNodeId ? state.nodeInspector[selectedNodeId] : undefined
  );

  if (!selectedNode) {
    return null;
  }

  const updateConfig = (config: PipelineNodeConfig) => {
    updateNodeConfig(selectedNode.id, config);
  };

  return (
    <aside className="node-config-panel w-[300px] shrink-0 overflow-y-auto border-l border-zinc-300 bg-white p-4 shadow-panel">
      <div className="space-y-4">
        <div>
          <h2 className="truncate text-sm font-semibold text-zinc-900">{selectedNode.data.label}</h2>
          <p className="mt-1 text-xs font-medium text-zinc-500">{selectedNode.data.kind}</p>
        </div>

        <fieldset className="space-y-3" disabled={isRunning}>
          {selectedNode.data.kind === "MOCK_SOURCE" ? (
            (() => {
              const config = selectedNode.data.config as MockSourceConfig;

              return (
                <>
                  <Field label="Rows">
                    <input
                      className={inputClass}
                      type="number"
                      min={1}
                      max={10000}
                      value={config.rowCount}
                      onChange={(event) =>
                        updateConfig({ ...config, rowCount: numberValue(event.target.value) })
                      }
                    />
                  </Field>
                  <Field label="Interval ms">
                    <input
                      className={inputClass}
                      type="number"
                      min={0}
                      value={config.intervalMs}
                      onChange={(event) =>
                        updateConfig({ ...config, intervalMs: numberValue(event.target.value) })
                      }
                    />
                  </Field>
                </>
              );
            })()
          ) : null}

          {selectedNode.data.kind === "HTTP_SOURCE" ? (
            (() => {
              const config = selectedNode.data.config as HttpSourceConfig;

              return (
                <>
                  <Field label="URL">
                    <input
                      className={inputClass}
                      value={config.url}
                      onChange={(event) => updateConfig({ ...config, url: event.target.value })}
                    />
                  </Field>
                  <Field label="Method">
                    <select
                      className={inputClass}
                      value={config.method}
                      onChange={(event) =>
                        updateConfig({
                          ...config,
                          method: event.target.value === "POST" ? "POST" : "GET"
                        })
                      }
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                    </select>
                  </Field>
                  <Field label="Body">
                    <textarea
                      className={textareaClass}
                      value={config.body}
                      onChange={(event) => updateConfig({ ...config, body: event.target.value })}
                    />
                  </Field>
                </>
              );
            })()
          ) : null}

          {selectedNode.data.kind === "DELAY" ? (
            (() => {
              const config = selectedNode.data.config as DelayConfig;

              return (
                <Field label="Delay ms">
                  <input
                    className={inputClass}
                    type="number"
                    min={0}
                    max={60000}
                    value={config.delayMs}
                    onChange={(event) =>
                      updateConfig({ ...config, delayMs: numberValue(event.target.value) })
                    }
                  />
                </Field>
              );
            })()
          ) : null}

          {selectedNode.data.kind === "JSON_FILTER" ? (
            (() => {
              const config = selectedNode.data.config as JsonFilterConfig;

              return (
                <Field label="JSONPath">
                  <input
                    className={inputClass}
                    value={config.expression}
                    onChange={(event) => updateConfig({ ...config, expression: event.target.value })}
                  />
                </Field>
              );
            })()
          ) : null}

          {selectedNode.data.kind === "CONSOLE_SINK" ? (
            (() => {
              const config = selectedNode.data.config as ConsoleSinkConfig;

              return (
                <Field label="Prefix">
                  <input
                    className={inputClass}
                    value={config.prefix}
                    onChange={(event) => updateConfig({ ...config, prefix: event.target.value })}
                  />
                </Field>
              );
            })()
          ) : null}
        </fieldset>

        {isRunning ? (
          <div className="space-y-2 border-t border-zinc-300 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-normal text-zinc-500">Live Preview</h3>
            <pre className="max-h-52 overflow-auto rounded-md border border-zinc-300 bg-zinc-950 p-3 text-xs leading-5 text-zinc-100">
              {JSON.stringify(selectedNode.data.preview, null, 2)}
            </pre>
          </div>
        ) : null}

        <div className="space-y-2 border-t border-zinc-300 pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-normal text-zinc-500">
            Node Inspector
          </h3>
          {inspector ? (
            <div className="space-y-3">
              <div className="text-xs text-zinc-500">
                Updated {new Date(inspector.updatedAt).toLocaleTimeString()}
              </div>
              <div>
                <div className="mb-1 text-xs font-semibold text-zinc-600">Input</div>
                <pre className="max-h-44 overflow-auto rounded-md border border-zinc-300 bg-zinc-950 p-3 text-xs leading-5 text-zinc-100">
                  {JSON.stringify(inspector.input, null, 2)}
                </pre>
              </div>
              <div>
                <div className="mb-1 text-xs font-semibold text-zinc-600">Output</div>
                <pre className="max-h-44 overflow-auto rounded-md border border-zinc-300 bg-zinc-950 p-3 text-xs leading-5 text-zinc-100">
                  {JSON.stringify(inspector.output, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
              Run the workflow to inspect this node.
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
