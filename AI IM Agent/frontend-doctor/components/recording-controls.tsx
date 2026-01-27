"use client";

import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";

interface RecordingControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  isMuted: boolean;
  connectionStatus: "connected" | "disconnected" | "reconnecting" | "connecting";
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onToggleMute: () => void;
  error?: string | null;
}

export function RecordingControls({
  isRecording,
  isPaused,
  isMuted,
  connectionStatus,
  onStart,
  onStop,
  onPause,
  onResume,
  onToggleMute,
  error,
}: RecordingControlsProps) {
  const getStatusBadge = () => {
    switch (connectionStatus) {
      case "connected":
        return <Badge variant="success">Connected</Badge>;
      case "connecting":
        return <Badge variant="info">Connecting...</Badge>;
      case "reconnecting":
        return <Badge variant="warning">Reconnecting...</Badge>;
      case "disconnected":
        return <Badge variant="critical">Disconnected</Badge>;
    }
  };

  return (
    <Card title="Recording Controls">
      <div className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">Connection Status:</span>
          {getStatusBadge()}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Recording Status */}
        {isRecording && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">
              {isPaused ? "Recording Paused" : "Recording..."}
            </span>
            {isMuted && (
              <Badge variant="warning" className="ml-2">
                Muted
              </Badge>
            )}
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-3">
          {!isRecording ? (
            <Button
              variant="primary"
              size="lg"
              onClick={onStart}
              disabled={connectionStatus === "connecting" || connectionStatus === "reconnecting"}
              className="flex-1"
            >
              Start Recording
            </Button>
          ) : (
            <>
              {isPaused ? (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={onResume}
                  className="flex-1"
                >
                  Resume
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={onPause}
                  className="flex-1"
                >
                  Pause
                </Button>
              )}
              <Button
                variant="danger"
                size="lg"
                onClick={onStop}
                className="flex-1"
              >
                Stop
              </Button>
            </>
          )}
        </div>

        {/* Mute Toggle */}
        {isRecording && (
          <Button
            variant="ghost"
            size="md"
            onClick={onToggleMute}
            className="w-full"
          >
            {isMuted ? "🔇 Unmute" : "🎤 Mute"}
          </Button>
        )}
      </div>
    </Card>
  );
}
