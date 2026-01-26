"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import {
  getWebSocketClient,
  WebSocketEvent,
  WebSocketEventType,
} from "@/lib/websocket";
import { getAuthToken } from "@/lib/api-client";

const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:3001";

interface UseWebSocketOptions {
  sessionId: string | null;
  enabled?: boolean;
  onTranscriptionPartial?: (event: WebSocketEvent) => void;
  onTranscriptionFinal?: (event: WebSocketEvent) => void;
  onSOAPUpdate?: (event: WebSocketEvent) => void;
  onAlert?: (event: WebSocketEvent) => void;
  onError?: (event: WebSocketEvent) => void;
  onConnectionStatus?: (
    status: "connected" | "disconnected" | "reconnecting" | "connecting"
  ) => void;
}

/**
 * WebSocket hook for managing real-time transcription connection
 */
export function useWebSocket(options: UseWebSocketOptions) {
  const {
    sessionId,
    enabled = true,
    onTranscriptionPartial,
    onTranscriptionFinal,
    onSOAPUpdate,
    onAlert,
    onError,
    onConnectionStatus,
  } = options;

  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected" | "reconnecting" | "connecting"
  >("disconnected");
  const unsubscribeRefs = useRef<Array<() => void>>([]);

  const connect = useCallback(async () => {
    if (!enabled || !sessionId) return;

    const token = getAuthToken();
    if (!token) {
      console.error("No auth token available for WebSocket connection");
      return;
    }

    try {
      setConnectionStatus("connecting");
      const wsClient = getWebSocketClient(WS_BASE_URL, token);
      
      // Set up event listeners
      if (onTranscriptionPartial) {
        const unsubscribe = wsClient.on("transcription_partial", (event) => {
          onTranscriptionPartial(event);
        });
        unsubscribeRefs.current.push(unsubscribe);
      }

      if (onTranscriptionFinal) {
        const unsubscribe = wsClient.on("transcription_final", (event) => {
          onTranscriptionFinal(event);
        });
        unsubscribeRefs.current.push(unsubscribe);
      }

      if (onSOAPUpdate) {
        const unsubscribe = wsClient.on("soap_update", (event) => {
          onSOAPUpdate(event);
        });
        unsubscribeRefs.current.push(unsubscribe);
      }

      if (onAlert) {
        const unsubscribe = wsClient.on("alert", (event) => {
          onAlert(event);
        });
        unsubscribeRefs.current.push(unsubscribe);
      }

      if (onError) {
        const unsubscribe = wsClient.on("error", (event) => {
          onError(event);
        });
        unsubscribeRefs.current.push(unsubscribe);
      }

      // Connection status handler
      const statusUnsubscribe = wsClient.on("connection_status", (event) => {
        if (event.type === "connection_status") {
          setConnectionStatus(event.status);
          onConnectionStatus?.(event.status);
        }
      });
      unsubscribeRefs.current.push(statusUnsubscribe);

      await wsClient.connect(sessionId);
      wsClient.startRecording(sessionId);
      setConnectionStatus("connected");
    } catch (error) {
      console.error("WebSocket connection failed:", error);
      setConnectionStatus("disconnected");
      onError?.({
        type: "error",
        message: "Failed to connect to WebSocket",
      } as WebSocketEvent);
    }
  }, [
    enabled,
    sessionId,
    onTranscriptionPartial,
    onTranscriptionFinal,
    onSOAPUpdate,
    onAlert,
    onError,
    onConnectionStatus,
  ]);

  const disconnect = useCallback(() => {
    const token = getAuthToken();
    if (!token) return;

    const wsClient = getWebSocketClient(WS_BASE_URL, token);
    wsClient.disconnect();
    setConnectionStatus("disconnected");

    // Clean up all subscriptions
    unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe());
    unsubscribeRefs.current = [];
  }, []);

  const sendAudioChunk = useCallback(
    (chunk: ArrayBuffer) => {
      const token = getAuthToken();
      if (!token) return;

      const wsClient = getWebSocketClient(WS_BASE_URL, token);
      wsClient.sendAudioChunk(chunk);
    },
    []
  );

  const stopRecording = useCallback(() => {
    const token = getAuthToken();
    if (!token) return;

    const wsClient = getWebSocketClient(WS_BASE_URL, token);
    wsClient.stopRecording(sessionId || "");
  }, [sessionId]);

  // Auto-connect when enabled and sessionId changes
  useEffect(() => {
    if (enabled && sessionId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, sessionId, connect, disconnect]);

  return {
    connectionStatus,
    connect,
    disconnect,
    sendAudioChunk,
    stopRecording,
  };
}
