import { Module, Global } from '@nestjs/common';
import { WhisperProvider } from './whisper.provider';
import { AWSTranscribeProvider } from './aws-transcribe.provider';
import { TranscriptionProviderFactory } from './transcription-provider.factory';

@Global()
@Module({
  providers: [
    WhisperProvider,
    AWSTranscribeProvider,
    TranscriptionProviderFactory,
  ],
  exports: [
    WhisperProvider,
    AWSTranscribeProvider,
    TranscriptionProviderFactory,
  ],
})
export class TranscriptionProvidersModule {
  constructor(private factory: TranscriptionProviderFactory) {}

  async onModuleInit() {
    // Initialize all providers when module loads
    await this.factory.initializeProviders();
  }
}
