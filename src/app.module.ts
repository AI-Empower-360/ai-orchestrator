import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { NotesModule } from './notes/notes.module';
import { AlertsModule } from './alerts/alerts.module';
import { TranscriptionModule } from './transcription/transcription.module';
import { HealthModule } from './health/health.module';
import { LLMModule } from './agents/llm/llm.module';
import { AgentOrchestratorModule } from './agents/orchestrator/agent-orchestrator.module';
import { OrganizationModule } from './organization/organization.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    HealthModule,
    LLMModule,
    AgentOrchestratorModule,
    AuthModule,
    NotesModule,
    AlertsModule,
    TranscriptionModule,
    OrganizationModule,
  ],
})
export class AppModule {}
