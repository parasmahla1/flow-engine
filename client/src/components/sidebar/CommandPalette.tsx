"use client";

import { Command, LocateFixed, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useReactFlow } from "reactflow";
import { nodeDefinitions } from "@flowengine/shared";
import { usePipelineStore } from "@/store/pipelineStore";

export const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { screenToFlowPosition, setCenter } = useReactFlow();
  const nodes = usePipelineStore((state) => state.nodes);
  const isRunning = usePipelineStore((state) => state.isRunning);
  const addNode = usePipelineStore((state) => state.addNode);
  const selectNode = usePipelineStore((state) => state.selectNode);

  const commands = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const addCommands = nodeDefinitions.map((definition) => ({
      id: `add-${definition.kind}`,
      label: `Add ${definition.label}`,
      description: definition.description,
      disabled: isRunning,
      icon: Plus,
      run: () => {
        const nodeId = addNode(
          definition.kind,
          screenToFlowPosition({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
          })
        );

        if (nodeId) {
          selectNode(nodeId);
        }
      }
    }));
    const jumpCommands = nodes.map((node) => ({
      id: `jump-${node.id}`,
      label: `Jump to ${node.data.label}`,
      description: node.data.kind,
      disabled: false,
      icon: LocateFixed,
      run: () => {
        selectNode(node.id);
        setCenter(node.position.x + 105, node.position.y + 43, {
          zoom: 1,
          duration: 350
        });
      }
    }));

    return [...addCommands, ...jumpCommands].filter((item) => {
      if (!normalizedQuery) {
        return true;
      }

      return `${item.label} ${item.description}`.toLowerCase().includes(normalizedQuery);
    });
  }, [addNode, isRunning, nodes, query, screenToFlowPosition, selectNode, setCenter]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
        return;
      }

      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setQuery("");
    }
  }, [open]);

  const runCommand = (command: (typeof commands)[number]) => {
    if (command.disabled) {
      return;
    }

    command.run();
    setOpen(false);
  };

  return (
    <section className="space-y-2">
      <button
        type="button"
        className="flex h-9 w-full items-center justify-between rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-800 shadow-sm transition hover:border-teal-600 hover:text-teal-700"
        onClick={() => setOpen(true)}
      >
        <span className="inline-flex items-center gap-2">
          <Command size={16} />
          Commands
        </span>
        <span className="text-xs text-zinc-500">Ctrl K</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-zinc-950/35 px-4 pt-[12vh]" role="dialog" aria-modal="true">
          <div className="mx-auto max-w-xl overflow-hidden rounded-md border border-zinc-300 bg-white shadow-xl">
            <div className="flex items-center gap-2 border-b border-zinc-200 px-3">
              <Search size={17} className="text-zinc-500" />
              <input
                ref={inputRef}
                className="h-12 min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && commands[0]) {
                    event.preventDefault();
                    runCommand(commands[0]);
                  }
                }}
                placeholder="Search nodes and commands"
              />
              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
                onClick={() => setOpen(false)}
                aria-label="Close commands"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="max-h-80 overflow-auto p-2">
              {commands.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-zinc-500">No commands found</div>
              ) : (
                commands.map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={item.disabled}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => runCommand(item)}
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-zinc-100 text-teal-700">
                        <Icon size={16} />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-zinc-900">
                          {item.label}
                        </span>
                        <span className="block truncate text-xs text-zinc-500">{item.description}</span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};
