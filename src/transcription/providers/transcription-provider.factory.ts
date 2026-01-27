import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TranscriptionProvider } from './transcription-provider.interface';
import { WhisperProvider } from './whisper.provider';
import { AWSTranscribeProvider } from './aws-transcribe.provider';

export type TranscriptionProviderType = 'whisper' | 'aws-transcribe' | 'mock';

@Injectable()
export class TranscriptionProviderFactory {
  private readonly logger = new Logger(TranscriptionProviderFactory.name);
  private providers: Map<TranscriptionProviderType, TranscriptionProvider> =
    new Map();

  constructor(
    private configService: ConfigService,
    private whisperProvider: WhisperProvider,
    private awsTranscribeProvider: AWSTranscribeProvider,
  ) {}

  /**
   * Initialize all transcription providers
   */
  async initializeProviders(): Promise<void> {
    // Initialize Whisper
    try {
      await this.whisperProvider.initialize();
      if (this.whisperProvider.isAvailable()) {
        this.providers.set('whisper', this.whisperProvider);
        this.logger.log('Whisper provider registered');
      }
    } catch (error: any) {
      this.logger.warn(`Failed to initialize Whisper: ${error.message}`);
    }

    // Initialize AWS Transcribe
    try {
      await this.awsTranscribeProvider.initialize();
      if (this.awsTranscribeProvider.isAvailable()) {
        this.providers.set('aws-transcribe', this.awsTranscribeProvider);
        this.logger.log('AWS Transcribe provider registered');
      }
    } catch (error: any) {
      this.logger.warn(`Failed to initialize AWS Transcribe: ${error.message}`);
    }
  }

  /**
   * Get the active transcription provider based on configuration
   */
  getProvider(): TranscriptionProvider {
    const providerType = this.configService.get<TranscriptionProviderType>(
      'TRANSCRIPTION_PROVIDER',
      'whisper',
    );

    // Check if requested provider is available
    const provider = this.providers.get(providerType);

    if (provider) {
      this.logger.log(`Using transcription provider: ${providerType}`);
      return provider;
    }

    // Fallback to available provider
    if (this.providers.has('whisper')) {
      this.logger.warn(
        `Requested provider '${providerType}' not available. Falling back to Whisper.`,
      );
      return this.providers.get('whisper')!;
    }

    if (this.providers.has('aws-transcribe')) {
      this.logger.warn(
        `Requested provider '${providerType}' not available. Falling back to AWS Transcribe.`,
      );
      return this.providers.get('aws-transcribe')!;
    }

    // No providers available - throw error
    throw new Error(
      'No transcription providers available. Please configure OPENAI_API_KEY or AWS credentials.',
    );
  }

  /**
   * Get all available providers
   */
  getAvailableProviders(): TranscriptionProviderType[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if a specific provider is available
   */
  isProviderAvailable(type: TranscriptionProviderType): boolean {
    return this.providers.has(type);
  }
}
