"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UseAudioRecorderOptions {
  onAudioChunk?: (chunk: ArrayBuffer) => void;
  sampleRate?: number;
  chunkInterval?: number; // ms
}

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  isMuted: boolean;
  error: string | null;
}

/**
 * Audio recording hook using Web Audio API
 * Handles microphone access and audio chunk streaming
 */
export function useAudioRecorder(options: UseAudioRecorderOptions = {}) {
  const { onAudioChunk, sampleRate = 16000, chunkInterval = 100 } = options;

  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    isMuted: false,
    error: null,
  });

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Request microphone permission
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (error) {
      console.error("Microphone permission denied:", error);
      setState((prev) => ({
        ...prev,
        error: "Microphone access denied. Please enable microphone permissions.",
      }));
      return false;
    }
  }, [sampleRate]);

  /**
   * Start recording
   */
  const startRecording = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, error: null }));

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      mediaStreamRef.current = stream;

      // Create audio context
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)({
        sampleRate,
      });
      audioContextRef.current = audioContext;

      // Create audio source from stream
      const source = audioContext.createMediaStreamSource(stream);
      
      // Create script processor for audio chunks
      const bufferSize = 4096;
      const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        if (!state.isMuted && state.isRecording && !state.isPaused) {
          const inputBuffer = event.inputBuffer;
          const inputData = inputBuffer.getChannelData(0);
          
          // Convert Float32Array to Int16Array (PCM)
          const int16Buffer = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            int16Buffer[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }

          // Convert to ArrayBuffer
          const arrayBuffer = int16Buffer.buffer;
          onAudioChunk?.(arrayBuffer);
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      setState((prev) => ({
        ...prev,
        isRecording: true,
        isPaused: false,
      }));
    } catch (error) {
      console.error("Failed to start recording:", error);
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "Failed to start recording. Please check microphone permissions.",
      }));
    }
  }, [sampleRate, onAudioChunk, state.isMuted, state.isRecording, state.isPaused]);

  /**
   * Stop recording
   */
  const stopRecording = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isRecording: false,
      isPaused: false,
    }));
  }, []);

  /**
   * Pause recording
   */
  const pauseRecording = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => (track.enabled = false));
    }
    setState((prev) => ({ ...prev, isPaused: true }));
  }, []);

  /**
   * Resume recording
   */
  const resumeRecording = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => (track.enabled = true));
    }
    setState((prev) => ({ ...prev, isPaused: false }));
  }, []);

  /**
   * Toggle mute
   */
  const toggleMute = useCallback(() => {
    setState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return {
    ...state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    toggleMute,
    requestPermission,
  };
}
