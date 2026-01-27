/**
 * WebSocket Client for Live Transcription using Socket.io
 * Handles real-time audio streaming and transcription updates
 */

import { io, Socket } from "socket.io-client";

export type WebSocketEventType =
  | "transcription_partial"
  | "transcription_final"
  | "soap_update"
  | "alert"
  | "error"
  | "connection_status";

export interface TranscriptionPartialEvent {
  type: "transcription_partial";
  sessionId: string;
  text: string;
  speaker?: string;
  timestamp: number;
}

export interface TranscriptionFinalEvent {
  type: "transcription_final";
  sessionId: string;
  text: string;
  speaker: string;
  timestamp: number;
}

export interface SOAPUpdateEvent {
  type: "soap_update";
  sessionId: string;
  soap: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
  };
}

export interface AlertEvent {
  type: "alert";
  alert: {
    id: string;
    severity: "info" | "warning" | "critical";
    message: string;
    timestamp: string;
  };
}

export interface ErrorEvent {
  type: "error";
  message: string;
  code?: string;
}

export interface ConnectionStatusEvent {
  type: "connection_status";
  status: "connected" | "disconnected" | "reconnecting" | "connecting";
}

export type WebSocketEvent =
  | TranscriptionPartialEvent
  | TranscriptionFinalEvent
  | SOAPUpdateEvent
  | AlertEvent
  | ErrorEvent
  | ConnectionStatusEvent;

type EventCallback = (event: WebSocketEvent) => void;

class WebSocketClient {
  private socket: Socket | null = null;
  private url: string;
  private token: string;
  private sessionId: string | null = null;
  private status: "connected" | "disconnected" | "reconnecting" | "connecting" =
    "disconnected";
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private eventCallbacks: Map<WebSocketEventType, Set<EventCallback>> = new Map();
  private isIntentionallyDisconnected = false;

  constructor(wsBaseUrl: string, token: string) {
    // Convert http/https to ws/wss, but Socket.io handles this automatically
    // Remove ws:// or wss:// prefix if present, Socket.io will add it
    let baseUrl = wsBaseUrl.replace(/^https?:\/\//, "");
    baseUrl = baseUrl.replace(/^wss?:\/\//, "");
    this.url = baseUrl;
    this.token = token;
  }

  matches(wsBaseUrl: string, token: string): boolean {
    let baseUrl = wsBaseUrl.replace(/^https?:\/\//, "");
    baseUrl = baseUrl.replace(/^wss?:\/\//, "");
    return this.url === baseUrl && this.token === token;
  }

  /**
   * Connect to WebSocket server
   */
  connect(sessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.sessionId = sessionId;
      this.isIntentionallyDisconnected = false;
      this.status = "connecting";
      this.emit({ type: "connection_status", status: "connecting" });

      // Socket.io connection URL
      const socketUrl = `http://${this.url}`;

      try {
        this.socket = io(`${socketUrl}/ws/transcription`, {
          auth: {
            token: this.token,
          },
          query: {
            token: this.token,
          },
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: this.maxReconnectAttempts,
        });

        this.socket.on("connect", () => {
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          this.status = "connected";
          this.emit({
            type: "connection_status",
            status: "connected",
          });
          resolve();
        });

        this.socket.on("disconnect", () => {
          this.status = "disconnected";
          this.emit({
            type: "connection_status",
            status: "disconnected",
          });

          // Auto-reconnect is handled by Socket.io, but we track it
          if (!this.isIntentionallyDisconnected) {
            this.status = "reconnecting";
            this.emit({
              type: "connection_status",
              status: "reconnecting",
            });
          }
        });

        this.socket.on("connect_error", (error) => {
          console.error("Socket.io connection error:", error);
          this.status = "disconnected";
          this.emit({
            type: "error",
            message: error.message || "WebSocket connection error",
            code: "CONNECTION_ERROR",
          });
          reject(error);
        });

        // Listen to all event types
        this.socket.on("transcription_partial", (data: any) => {
          this.emit({
            type: "transcription_partial",
            ...data,
          });
        });

        this.socket.on("transcription_final", (data: any) => {
          this.emit({
            type: "transcription_final",
            ...data,
          });
        });

        this.socket.on("soap_update", (data: any) => {
          this.emit({
            type: "soap_update",
            ...data,
          });
        });

        this.socket.on("alert", (data: any) => {
          this.emit({
            type: "alert",
            alert: data.alert || data,
          });
        });

        this.socket.on("error", (data: any) => {
          this.emit({
            type: "error",
            message: data.message || "Unknown error",
            code: data.code,
          });
        });

        this.socket.on("connection_status", (data: any) => {
          // Allow server-side status updates to override local view if present
          if (
            data?.status === "connected" ||
            data?.status === "disconnected" ||
            data?.status === "reconnecting" ||
            data?.status === "connecting"
          ) {
            this.status = data.status;
          }
          this.emit({
            type: "connection_status",
            status: data.status || "disconnected",
          });
        });
      } catch (error) {
        this.status = "disconnected";
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.isIntentionallyDisconnected = true;
    this.status = "disconnected";

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.emit({
      type: "connection_status",
      status: "disconnected",
    });
  }

  /**
   * Send audio chunk to server
   */
  sendAudioChunk(chunk: ArrayBuffer): void {
    if (this.socket?.connected && this.sessionId) {
      // Convert ArrayBuffer to base64
      const base64 = this.arrayBufferToBase64(chunk);

      this.socket.emit("audio_chunk", {
        type: "audio_chunk",
        sessionId: this.sessionId,
        chunk: base64,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Send start recording event
   */
  startRecording(sessionId: string): void {
    if (this.socket?.connected) {
      this.socket.emit("start_recording", {
        type: "start_recording",
        sessionId,
      });
    }
  }

  /**
   * Send stop recording event
   */
  stopRecording(sessionId: string): void {
    if (this.socket?.connected && this.sessionId) {
      this.socket.emit("stop_recording", {
        type: "stop_recording",
        sessionId: this.sessionId,
      });
    }
  }

  /**
   * Subscribe to WebSocket events
   */
  on(eventType: WebSocketEventType, callback: EventCallback): () => void {
    if (!this.eventCallbacks.has(eventType)) {
      this.eventCallbacks.set(eventType, new Set());
    }
    this.eventCallbacks.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.eventCallbacks.get(eventType)?.delete(callback);
    };
  }

  /**
   * Emit event to all subscribers
   */
  private emit(event: WebSocketEvent): void {
    // Emit to specific event type subscribers
    this.eventCallbacks.get(event.type)?.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error("Error in event callback:", error);
      }
    });
  }

  /**
   * Get current connection status
   */
  getStatus(): "connected" | "disconnected" | "reconnecting" | "connecting" {
    return this.status;
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

// Singleton instance
let wsClientInstance: WebSocketClient | null = null;

/**
 * Get or create WebSocket client instance
 */
export function getWebSocketClient(wsBaseUrl: string, token: string): WebSocketClient {
  if (wsClientInstance && !wsClientInstance.matches(wsBaseUrl, token)) {
    // Token or base URL changed (e.g. logout/login) — recreate client
    wsClientInstance.disconnect();
    wsClientInstance = null;
  }

  if (!wsClientInstance) wsClientInstance = new WebSocketClient(wsBaseUrl, token);
  return wsClientInstance;
}

/**
 * Reset WebSocket client instance (for testing or re-initialization)
 */
export function resetWebSocketClient(): void {
  if (wsClientInstance) {
    wsClientInstance.disconnect();
    wsClientInstance = null;
  }
}
