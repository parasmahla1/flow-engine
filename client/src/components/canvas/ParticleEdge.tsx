"use client";

import { memo, useEffect, useState } from "react";
import { X } from "lucide-react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "reactflow";
import { usePipelineStore, type FlowEdgeData } from "@/store/pipelineStore";

export const ParticleEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerEnd,
    style,
    data,
    selected
  }: EdgeProps<FlowEdgeData>) => {
    const [particleVisible, setParticleVisible] = useState(false);
    const deleteEdge = usePipelineStore((state) => state.deleteEdge);
    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition
    });
    const baseEdgeProps = {
      ...(markerEnd ? { markerEnd } : {}),
      style: {
        ...style,
        strokeWidth: selected ? 3 : style?.strokeWidth,
        stroke: selected ? "#dc2626" : style?.stroke
      },
      interactionWidth: 18
    };

    useEffect(() => {
      if (!data?.flowNonce) {
        return;
      }

      setParticleVisible(true);
      const timeoutId = window.setTimeout(() => {
        setParticleVisible(false);
      }, 900);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }, [data?.flowNonce]);

    return (
      <>
        <BaseEdge id={id} path={edgePath} {...baseEdgeProps} />
        {particleVisible ? (
          <circle key={data?.flowNonce ?? id} r="4.5" fill="#0ea5e9" className="flow-particle">
            <animateMotion dur="850ms" begin="0s" fill="remove" path={edgePath} />
          </circle>
        ) : null}
        {selected ? (
          <EdgeLabelRenderer>
            <button
              type="button"
              className="nodrag nopan pointer-events-auto grid h-7 w-7 place-items-center rounded-md border border-red-200 bg-white text-red-600 shadow-sm transition hover:border-red-500 hover:bg-red-50"
              style={{
                position: "absolute",
                transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`
              }}
              onClick={(event) => {
                event.stopPropagation();
                deleteEdge(id);
              }}
              aria-label="Delete edge"
              title="Delete edge"
            >
              <X size={14} />
            </button>
          </EdgeLabelRenderer>
        ) : null}
      </>
    );
  }
);

ParticleEdge.displayName = "ParticleEdge";
