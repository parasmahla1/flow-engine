"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@flowengine/shared";
import { usePipelineStore } from "@/store/pipelineStore";

type PipelineSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000/pipeline";

export const usePipelineExecution = () => {
  const socketRef = useRef<PipelineSocket | null>(null);

  useEffect(() => {
    let disposed = false;

    void import("socket.io-client").then(({ io }) => {
      if (disposed) {
        return;
      }

      const socket: PipelineSocket = io(socketUrl, {
        transports: ["websocket"],
        autoConnect: true
      });

      socketRef.current = socket;
      usePipelineStore.getState().setConnectionStatus("connecting");

      socket.on("connect", () => {
        usePipelineStore.getState().setConnectionStatus("connected");
      });

      socket.on("disconnect", () => {
        usePipelineStore.getState().setConnectionStatus("disconnected");
      });

      socket.on("execution_started", ({ executionId }) => {
        usePipelineStore.getState().startExecution(executionId);
      });

      socket.on("node_status_changed", ({ nodeId, status, message }) => {
        usePipelineStore.getState().setNodeStatus(nodeId, status);

        if (status === "error" && message) {
          usePipelineStore.getState().failExecution(message);
        }
      });

      socket.on("data_flow", ({ edgeId, chunkSize }) => {
        usePipelineStore.getState().triggerFlow(edgeId, chunkSize);
      });

      socket.on("execution_completed", () => {
        usePipelineStore.getState().finishExecution();
      });

      socket.on("execution_error", ({ message }) => {
        usePipelineStore.getState().failExecution(message);
      });
    });

    return () => {
      disposed = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  const runPipeline = useCallback(() => {
    const socket = socketRef.current;
    const state = usePipelineStore.getState();

    if (!socket?.connected) {
      state.failExecution("Socket connection is not available.");
      return;
    }

    socket.emit("execute_pipeline", state.toPipelineSchema());
  }, []);

  const stopLocalExecution = useCallback(() => {
    usePipelineStore.getState().stopLocalExecution();
  }, []);

  return { runPipeline, stopLocalExecution };
};
