import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import OpenAI from 'openai';
import {
  TranscriptionProvider,
  TranscriptionResult,
  TranscriptionOptions,
} from './transcription-provider.interface';

@Injectable()
export class WhisperProvider implements TranscriptionProvider {
  private readonly logger = new Logger(WhisperProvider.name);
  private openai: OpenAI | null = null;
  private streamingSessions: Map<string, any> = new Map();

  constructor(private configService: ConfigService) {}

  async initialize(): Promise<void> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
      this.logger.log('OpenAI Whisper provider initialized');
    } else {
      this.logger.warn('OpenAI API key not set. Whisper provider unavailable.');
    }
  }

  isAvailable(): boolean {
    return this.openai !== null;
  }

  async transcribe(
    audioBuffer: Buffer,
    options?: TranscriptionOptions,
  ): Promise<TranscriptionResult> {
    if (!this.openai) {
      throw new Error('OpenAI Whisper provider not initialized');
    }

    try {
      // Convert Buffer to Readable stream (required by OpenAI SDK in Node.js)
      const audioStream = Readable.from(audioBuffer);
      // Set path property with file extension (required by OpenAI SDK)
      (audioStream as any).path = `audio.${options?.format || 'webm'}`;

      const response = await this.openai.audio.transcriptions.create({
        file: audioStream as any,
        model: 'whisper-1',
        language: options?.language || 'en',
        response_format: 'verbose_json',
        temperature: 0,
      });

      return {
        text: response.text,
        confidence: 1.0, // Whisper doesn't provide confidence scores
        language: response.language || options?.language || 'en',
        isPartial: false,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      this.logger.error(`Whisper transcription failed: ${error.message}`, error.stack);
      throw new Error(`Whisper transcription failed: ${error.message}`);
    }
  }

  async startStreaming(
    sessionId: string,
    onResult: (result: TranscriptionResult) => void,
    onError?: (error: Error) => void,
  ): Promise<void> {
    if (!this.openai) {
      throw new Error('OpenAI Whisper provider not initialized');
    }

    // Note: OpenAI Whisper API doesn't support true streaming
    // We'll accumulate chunks and transcribe periodically
    this.streamingSessions.set(sessionId, {
      onResult,
      onError,
      audioChunks: [],
      lastTranscriptionTime: Date.now(),
      transcriptionInterval: null,
    });

    // Set up periodic transcription (every 3 seconds)
    const session = this.streamingSessions.get(sessionId);
    session.transcriptionInterval = setInterval(async () => {
      if (session.audioChunks.length > 0) {
        try {
          // Combine chunks and transcribe
          const combinedBuffer = Buffer.concat(session.audioChunks);
          const result = await this.transcribe(combinedBuffer);
          
          // Mark as partial for streaming
          result.isPartial = true;
          onResult(result);

          // Clear chunks after transcription
          session.audioChunks = [];
        } catch (error: any) {
          this.logger.error(`Streaming transcription error: ${error.message}`);
          if (onError) {
            onError(error);
          }
        }
      }
    }, 3000); // Transcribe every 3 seconds

    this.logger.log(`Whisper streaming session started: ${sessionId}`);
  }

  async processAudioChunk(sessionId: string, audioChunk: Buffer): Promise<void> {
    const session = this.streamingSessions.get(sessionId);
    if (session) {
      session.audioChunks.push(audioChunk);
    }
  }

  async stopStreaming(sessionId: string): Promise<void> {
    const session = this.streamingSessions.get(sessionId);
    if (session) {
      if (session.transcriptionInterval) {
        clearInterval(session.transcriptionInterval);
      }

      // Transcribe any remaining chunks
      if (session.audioChunks.length > 0) {
        try {
          const combinedBuffer = Buffer.concat(session.audioChunks);
          const result = await this.transcribe(combinedBuffer);
          result.isPartial = false; // Final result
          session.onResult(result);
        } catch (error: any) {
          this.logger.error(`Final transcription error: ${error.message}`);
        }
      }

      this.streamingSessions.delete(sessionId);
      this.logger.log(`Whisper streaming session stopped: ${sessionId}`);
    }
  }
}
