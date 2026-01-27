"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useWebSocket } from "@/shared/hooks/useWebSocket";
import { useAudioRecorder } from "@/shared/hooks/useAudioRecorder";
import { TranscriptionPanel } from "@/components/transcription-panel";
import { NotesPanel } from "@/components/notes-panel";
import { AlertsPanel, Alert } from "@/components/alerts-panel";
import { RecordingControls } from "@/components/recording-controls";
import {
  notesApi,
  alertsApi,
  SOAPNotes,
  ApiError,
} from "@/lib/api-client";
import {
  TranscriptionPartialEvent,
  TranscriptionFinalEvent,
  SOAPUpdateEvent,
  AlertEvent,
  WebSocketEvent,
} from "@/lib/websocket";

interface TranscriptionSegment {
  id: string;
  text: string;
  speaker?: string;
  timestamp: number;
  isFinal: boolean;
}

export default function DashboardPage() {
  // Session management
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const [isRecording, setIsRecording] = useState(false);

  // Transcription state
  const [transcripts, setTranscripts] = useState<TranscriptionSegment[]>([]);

  // SOAP notes state
  const [soapNotes, setSoapNotes] = useState<SOAPNotes>({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  });

  // Alerts state
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Error state
  const [error, setError] = useState<string | null>(null);
  const [wsError, setWsError] = useState<string | null>(null);

  // WebSocket event handlers
  const handleTranscriptionPartial = useCallback(
    (event: WebSocketEvent) => {
      if (event.type === "transcription_partial") {
        const e = event as TranscriptionPartialEvent;
        setTranscripts((prev) => {
          // Remove previous partial transcript for same session
          const filtered = prev.filter(
            (t) => !(t.id === `partial-${e.sessionId}` && !t.isFinal)
          );
          return [
            ...filtered,
            {
              id: `partial-${e.sessionId}`,
              text: e.text,
              speaker: e.speaker,
              timestamp: e.timestamp,
              isFinal: false,
            },
          ];
        });
      }
    },
    []
  );

  const handleTranscriptionFinal = useCallback((event: WebSocketEvent) => {
    if (event.type === "transcription_final") {
      const e = event as TranscriptionFinalEvent;
      setTranscripts((prev) => {
        // Remove partial transcript
        const filtered = prev.filter(
          (t) => !(t.id === `partial-${e.sessionId}` && !t.isFinal)
        );
        return [
          ...filtered,
          {
            id: `final-${e.sessionId}-${Date.now()}`,
            text: e.text,
            speaker: e.speaker,
            timestamp: e.timestamp,
            isFinal: true,
          },
        ];
      });
    }
  }, []);

  const handleSOAPUpdate = useCallback((event: WebSocketEvent) => {
    if (event.type === "soap_update") {
      const e = event as SOAPUpdateEvent;
      setSoapNotes((prev) => ({
        ...prev,
        ...e.soap,
      }));
    }
  }, []);

  const handleAlert = useCallback((event: WebSocketEvent) => {
    if (event.type === "alert") {
      const e = event as AlertEvent;
      setAlerts((prev) => [
        {
          id: e.alert.id,
          severity: e.alert.severity,
          message: e.alert.message,
          timestamp: e.alert.timestamp,
          acknowledged: false,
        },
        ...prev,
      ]);
    }
  }, []);

  const handleWSError = useCallback((event: WebSocketEvent) => {
    if (event.type === "error") {
      const e = event as { type: "error"; message: string; code?: string };
      setWsError(e.message);
    }
  }, []);

  const handleConnectionStatus = useCallback(
    (status: "connected" | "disconnected" | "reconnecting" | "connecting") => {
      if (status === "disconnected" && isRecording) {
        setWsError("Connection lost. Attempting to reconnect...");
      } else if (status === "connecting" || status === "reconnecting") {
        // Keep UI calm while attempting connection/reconnect
        setWsError(null);
      } else if (status === "connected") {
        setWsError(null);
      }
    },
    [isRecording]
  );

  // WebSocket connection
  const {
    connectionStatus,
    connect: connectWS,
    disconnect: disconnectWS,
    sendAudioChunk,
    stopRecording: stopWSRecording,
  } = useWebSocket({
    sessionId: isRecording ? sessionId : null,
    enabled: isRecording,
    onTranscriptionPartial: handleTranscriptionPartial,
    onTranscriptionFinal: handleTranscriptionFinal,
    onSOAPUpdate: handleSOAPUpdate,
    onAlert: handleAlert,
    onError: handleWSError,
    onConnectionStatus: handleConnectionStatus,
  });

  // Audio recorder
  const {
    isRecording: isAudioRecording,
    isPaused,
    isMuted,
    error: audioError,
    startRecording: startAudioRecording,
    stopRecording: stopAudioRecording,
    pauseRecording,
    resumeRecording,
    toggleMute,
    requestPermission,
  } = useAudioRecorder({
    onAudioChunk: sendAudioChunk,
  });

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load SOAP notes
        const notes = await notesApi.getNotes(sessionId);
        setSoapNotes(notes.soap);

        // Load alerts
        const alertsData = await alertsApi.getAlerts();
        setAlerts(alertsData.alerts);
      } catch (err) {
        if (err instanceof ApiError && err.status !== 404) {
          setError(err.message);
        }
        // 404 is expected for new sessions
      }
    };

    loadInitialData();
  }, [sessionId]);

  // Handle recording start
  const handleStartRecording = useCallback(async () => {
    setError(null);
    setWsError(null);

    // Request microphone permission
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      setError("Microphone permission is required to start recording.");
      return;
    }

    try {
      setIsRecording(true);
      await startAudioRecording();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start recording"
      );
      setIsRecording(false);
    }
  }, [requestPermission, startAudioRecording]);

  // Handle recording stop
  const handleStopRecording = useCallback(async () => {
    try {
      stopWSRecording();
      await stopAudioRecording();
      setIsRecording(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to stop recording"
      );
    }
  }, [stopWSRecording, stopAudioRecording]);

  // Handle SOAP notes update
  const handleSOAPNotesUpdate = useCallback(
    async (soap: Partial<SOAPNotes>) => {
      try {
        const updated = await notesApi.updateNotes(sessionId, soap);
        setSoapNotes(updated.soap);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Failed to update SOAP notes");
        }
      }
    },
    [sessionId]
  );

  // Handle alert acknowledgment
  const handleAcknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      await alertsApi.acknowledgeAlert(alertId);
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId ? { ...alert, acknowledged: true } : alert
        )
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to acknowledge alert");
      }
    }
  }, []);

  // Combined error state
  const displayError = error || wsError || audioError;

  return (
    <div className="space-y-6">
      {/* Recording Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <RecordingControls
            isRecording={isRecording && isAudioRecording}
            isPaused={isPaused}
            isMuted={isMuted}
            connectionStatus={connectionStatus}
            onStart={handleStartRecording}
            onStop={handleStopRecording}
            onPause={pauseRecording}
            onResume={resumeRecording}
            onToggleMute={toggleMute}
            error={displayError}
          />
        </div>

        {/* Main Content Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transcription Panel */}
          <div className="lg:col-span-2">
            <div className="h-[400px]">
              <TranscriptionPanel transcripts={transcripts} />
            </div>
          </div>

          {/* SOAP Notes Panel */}
          <div className="h-[500px]">
            <NotesPanel
              soap={soapNotes}
              sessionId={sessionId}
              onUpdate={handleSOAPNotesUpdate}
            />
          </div>

          {/* Alerts Panel */}
          <div className="h-[500px]">
            <AlertsPanel alerts={alerts} onAcknowledge={handleAcknowledgeAlert} />
          </div>
        </div>
      </div>
    </div>
  );
}
