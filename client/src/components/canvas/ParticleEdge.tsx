"use client";

import { memo } from "react";
import { BaseEdge, getBezierPath, type EdgeProps } from "reactflow";
import type { FlowEdgeData } from "@/store/pipelineStore";

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
    data
  }: EdgeProps<FlowEdgeData>) => {
    const [edgePath] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition
    });
    const baseEdgeProps = {
      ...(markerEnd ? { markerEnd } : {}),
      ...(style ? { style } : {})
    };

    return (
      <>
        <BaseEdge id={id} path={edgePath} {...baseEdgeProps} />
        {data?.flowNonce ? (
          <circle key={data.flowNonce} r="4.5" fill="#0ea5e9" className="flow-particle">
            <animateMotion dur="850ms" begin="0s" fill="freeze" path={edgePath} />
          </circle>
        ) : null}
      </>
    );
  }
);

ParticleEdge.displayName = "ParticleEdge";
