"use client";

import { useCallback, useEffect, useMemo } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
  type NodeTypes,
  type EdgeTypes
} from "reactflow";
import { shallow } from "zustand/shallow";
import { isNodeKind } from "@flowengine/shared";
import { ParticleEdge } from "./ParticleEdge";
import { PipelineNode } from "@/components/nodes/PipelineNode";
import { usePipelineStore } from "@/store/pipelineStore";

const selector = (state: ReturnType<typeof usePipelineStore.getState>) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  connectNodes: state.connectNodes,
  addNode: state.addNode,
  selectNode: state.selectNode,
  deleteSelection: state.deleteSelection,
  copySelection: state.copySelection,
  pasteWorkflow: state.pasteWorkflow,
  undo: state.undo,
  redo: state.redo
});

export const PipelineCanvas = () => {
  const { screenToFlowPosition } = useReactFlow();
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    connectNodes,
    addNode,
    selectNode,
    deleteSelection,
    copySelection,
    pasteWorkflow,
    undo,
    redo
  } =
    usePipelineStore(selector, shallow);

  const nodeTypes = useMemo<NodeTypes>(() => ({ pipelineNode: PipelineNode }), []);
  const edgeTypes = useMemo<EdgeTypes>(() => ({ particle: ParticleEdge }), []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const kind = event.dataTransfer.getData("application/flowengine-node");

      if (!isNodeKind(kind)) {
        return;
      }

      addNode(
        kind,
        screenToFlowPosition({
          x: event.clientX,
          y: event.clientY
        })
      );
    },
    [addNode, screenToFlowPosition]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const isEditable =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement;

      if (isEditable) {
        return;
      }

      const commandKey = event.metaKey || event.ctrlKey;

      if ((event.key === "Delete" || event.key === "Backspace") && !commandKey) {
        deleteSelection();
        return;
      }

      if (!commandKey) {
        return;
      }

      if (event.key.toLowerCase() === "z" && event.shiftKey) {
        event.preventDefault();
        redo();
        return;
      }

      if (event.key.toLowerCase() === "z") {
        event.preventDefault();
        undo();
        return;
      }

      if (event.key.toLowerCase() === "c") {
        event.preventDefault();
        copySelection();
        return;
      }

      if (event.key.toLowerCase() === "v") {
        event.preventDefault();
        pasteWorkflow();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [copySelection, deleteSelection, pasteWorkflow, redo, undo]);

  return (
    <section className="min-w-0 flex-1 bg-zinc-100">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={(connection) => {
          connectNodes(connection);
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onNodeClick={(_, node) => selectNode(node.id)}
        onPaneClick={() => selectNode(null)}
        fitView
        multiSelectionKeyCode={["Meta", "Shift"]}
        selectionKeyCode="Shift"
        deleteKeyCode={null}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: "particle" }}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} color="#c4c4c7" />
        <MiniMap
          pannable
          zoomable
          nodeColor={(node) => {
            const status = node.data?.status;

            if (status === "success") {
              return "#10b981";
            }

            if (status === "error") {
              return "#ef4444";
            }

            if (status === "processing") {
              return "#0ea5e9";
            }

            return "#71717a";
          }}
        />
        <Controls position="bottom-left" />
        <Panel position="top-left" className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-600 shadow-sm">
          DAG Canvas
        </Panel>
      </ReactFlow>
    </section>
  );
};
