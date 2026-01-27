import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TranscriptionGateway } from './transcription.gateway';
import { TranscriptionService } from './transcription.service';
import { AuthModule } from '../auth/auth.module';
import { NotesModule } from '../notes/notes.module';
import { AlertsModule } from '../alerts/alerts.module';
import { AgentOrchestratorModule } from '../agents/orchestrator/agent-orchestrator.module';
import { TranscriptionProvidersModule } from './providers/transcription-providers.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    }),
    TranscriptionProvidersModule,
    AuthModule,
    NotesModule,
    AgentOrchestratorModule,
    AlertsModule,
  ],
  providers: [TranscriptionGateway, TranscriptionService],
  exports: [TranscriptionService],
})
export class TranscriptionModule {}
