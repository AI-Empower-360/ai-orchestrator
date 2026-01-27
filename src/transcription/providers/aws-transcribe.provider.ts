import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  TranscribeStreamingClient,
  StartStreamTranscriptionCommand,
  AudioStream,
} from '@aws-sdk/client-transcribe-streaming';
import {
  TranscriptionProvider,
  TranscriptionResult,
  TranscriptionOptions,
} from './transcription-provider.interface';

@Injectable()
export class AWSTranscribeProvider implements TranscriptionProvider {
  private readonly logger = new Logger(AWSTranscribeProvider.name);
  private client: TranscribeStreamingClient | null = null;
  private streamingSessions: Map<string, any> = new Map();

  constructor(private configService: ConfigService) {}

  async initialize(): Promise<void> {
    const region = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

    if (region && accessKeyId && secretAccessKey) {
      this.client = new TranscribeStreamingClient({
        region: region,
        credentials: {
          accessKeyId: accessKeyId,
          secretAccessKey: secretAccessKey,
        },
      });
      this.logger.log('AWS Transcribe Medical provider initialized');
    } else {
      this.logger.warn('AWS credentials not set. AWS Transcribe provider unavailable.');
    }
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  async transcribe(
    audioBuffer: Buffer,
    options?: TranscriptionOptions,
  ): Promise<TranscriptionResult> {
    // AWS Transcribe Streaming is designed for streaming, not one-off transcription
    // For file-based transcription, use AWS Transcribe (not streaming) API
    // This is a simplified implementation
    throw new Error(
      'AWS Transcribe Streaming is designed for real-time streaming. Use startStreaming() instead.',
    );
  }

  async startStreaming(
    sessionId: string,
    onResult: (result: TranscriptionResult) => void,
    onError?: (error: Error) => void,
  ): Promise<void> {
    if (!this.client) {
      throw new Error('AWS Transcribe provider not initialized');
    }

    try {
      const languageCode = 'en-US';
      const mediaSampleRateHertz = 16000; // Standard for medical transcription
      const mediaEncoding = 'pcm'; // PCM format

      // Create session first
      const session = {
        onResult,
        onError,
        audioChunks: [],
        isActive: true,
      };

      this.streamingSessions.set(sessionId, session);

      // Create audio stream generator
      const audioStream = this.createAudioStream(sessionId);

      const command = new StartStreamTranscriptionCommand({
        LanguageCode: languageCode,
        MediaSampleRateHertz: mediaSampleRateHertz,
        MediaEncoding: mediaEncoding,
        Specialty: 'PRIMARYCARE', // Medical specialty
        Type: 'CONVERSATION', // Conversation type
        EnableChannelIdentification: true, // Identify speaker channels
        ShowSpeakerLabels: true, // Show speaker labels
        MediaStream: audioStream,
      });

      // Start the streaming transcription (async)
      this.client.send(command).then((response) => {
        // Handle transcription events
        if (response.TranscriptResultStream) {
          (async () => {
            try {
              for await (const event of response.TranscriptResultStream!) {
                if (!session.isActive) break;

                if (event.TranscriptEvent?.Transcript?.Results) {
                  for (const result of event.TranscriptEvent.Transcript.Results) {
                    if (result.Alternatives && result.Alternatives.length > 0) {
                      const alternative = result.Alternatives[0];
                      const transcriptionResult: TranscriptionResult = {
                        text: alternative.Transcript || '',
                        confidence: alternative.Confidence,
                        language: languageCode,
                        isPartial: !result.IsPartial,
                        speaker: alternative.Items?.[0]?.SpeakerLabel,
                        timestamp: Date.now(),
                      };

                      onResult(transcriptionResult);
                    }
                  }
                }
              }
            } catch (error: any) {
              if (session.isActive) {
                this.logger.error(`Error processing transcription stream: ${error.message}`);
                if (onError) {
                  onError(error);
                }
              }
            }
          })();
        }
      }).catch((error: any) => {
        this.logger.error(`AWS Transcribe streaming failed: ${error.message}`, error.stack);
        if (onError) {
          onError(error);
        }
      });

      this.logger.log(`AWS Transcribe streaming session started: ${sessionId}`);
    } catch (error: any) {
      this.logger.error(`AWS Transcribe streaming failed: ${error.message}`, error.stack);
      if (onError) {
        onError(error);
      }
      throw error;
    }
  }

  /**
   * Create audio stream for AWS Transcribe
   */
  private createAudioStream(sessionId: string): AsyncIterable<AudioStream> {
    const self = this;
    
    return {
      async *[Symbol.asyncIterator]() {
        const session = self.streamingSessions.get(sessionId);
        if (!session) return;

        while (session.isActive) {
          if (session.audioChunks.length > 0) {
            const chunk = session.audioChunks.shift();
            if (chunk) {
              yield {
                AudioEvent: {
                  AudioChunk: chunk,
                },
              };
            }
          } else {
            // Wait a bit before checking again
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      },
    };
  }

  async processAudioChunk(sessionId: string, audioChunk: Buffer): Promise<void> {
    const session = this.streamingSessions.get(sessionId);
    if (!session) {
      throw new Error(`No active streaming session found: ${sessionId}`);
    }

    try {
      // Convert audio chunk to PCM format if needed
      // AWS Transcribe expects PCM audio at 16kHz sample rate, 16-bit, mono
      const pcmChunk = this.convertToPCM(audioChunk);

      // Add chunk to session for streaming
      session.audioChunks.push(pcmChunk);
    } catch (error: any) {
      this.logger.error(`Error processing audio chunk: ${error.message}`);
      throw error;
    }
  }

  async stopStreaming(sessionId: string): Promise<void> {
    const session = this.streamingSessions.get(sessionId);
    if (session) {
      // Mark session as inactive to stop audio stream
      session.isActive = false;
      
      // Close the streaming connection
      // AWS Transcribe will automatically close when the stream ends
      this.streamingSessions.delete(sessionId);
      this.logger.log(`AWS Transcribe streaming session stopped: ${sessionId}`);
    }
  }

  /**
   * Convert audio buffer to PCM format (16kHz, 16-bit, mono)
   * This is a placeholder - actual conversion would use audio processing library
   */
  private convertToPCM(audioBuffer: Buffer): Buffer {
    // In production, use a library like 'wav' or 'ffmpeg' to convert
    // For now, return as-is (assuming it's already in correct format)
    return audioBuffer;
  }
}
