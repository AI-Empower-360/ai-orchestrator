/**
 * Interface for transcription providers
 * Allows switching between different transcription services
 */

export interface TranscriptionResult {
  text: string;
  confidence?: number;
  language?: string;
  isPartial?: boolean;
  speaker?: string;
  timestamp: number;
}

export interface TranscriptionProvider {
  /**
   * Initialize the provider
   */
  initialize(): Promise<void>;

  /**
   * Check if provider is available/configured
   */
  isAvailable(): boolean;

  /**
   * Transcribe audio buffer (synchronous/async)
   */
  transcribe(audioBuffer: Buffer, options?: TranscriptionOptions): Promise<TranscriptionResult>;

  /**
   * Start streaming transcription session
   */
  startStreaming(
    sessionId: string,
    onResult: (result: TranscriptionResult) => void,
    onError?: (error: Error) => void,
  ): Promise<void>;

  /**
   * Process audio chunk in streaming session
   */
  processAudioChunk(sessionId: string, audioChunk: Buffer): Promise<void>;

  /**
   * Stop streaming transcription session
   */
  stopStreaming(sessionId: string): Promise<void>;
}

export interface TranscriptionOptions {
  language?: string;
  sampleRate?: number;
  format?: 'wav' | 'mp3' | 'flac' | 'ogg' | 'webm';
  speakerIdentification?: boolean;
  medicalVocabulary?: boolean; // For medical-specific transcription
}
