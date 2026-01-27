import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NotesService } from '../notes/notes.service';
import { AlertsService } from '../alerts/alerts.service';
import { AgentOrchestratorService } from '../agents/orchestrator/agent-orchestrator.service';
import { TranscriptionProviderFactory } from './providers/transcription-provider.factory';
import {
  TranscriptionProvider,
  TranscriptionResult,
} from './providers/transcription-provider.interface';

interface TranscriptionCallback {
  (event: any): void;
}

interface ActiveSession {
  sessionId: string;
  callback: TranscriptionCallback;
  intervalId?: NodeJS.Timeout;
  transcriptBuffer: string[];
  fullTranscript: string; // Accumulated full transcript for AI processing
  provider?: TranscriptionProvider; // Real transcription provider
  useRealTranscription: boolean; // Whether to use real transcription or mock
}

@Injectable()
export class TranscriptionService implements OnModuleInit {
  private readonly logger = new Logger(TranscriptionService.name);
  private activeSessions: Map<string, ActiveSession> = new Map();
  private transcriptionProvider: TranscriptionProvider | null = null;
  private readonly USE_REAL_AI: boolean;
  private readonly USE_REAL_TRANSCRIPTION: boolean;

  constructor(
    private notesService: NotesService,
    private alertsService: AlertsService,
    private agentOrchestrator: AgentOrchestratorService,
    private providerFactory: TranscriptionProviderFactory,
  ) {
    // Check if OpenAI API key is configured and rule-based mode is not forced
    const forceRuleBased = process.env.FORCE_RULE_BASED === 'true';
    this.USE_REAL_AI = !!process.env.OPENAI_API_KEY && !forceRuleBased;

    // Check if real transcription should be used
    const transcriptionProvider = process.env.TRANSCRIPTION_PROVIDER;
    this.USE_REAL_TRANSCRIPTION =
      (transcriptionProvider === 'whisper' && !!process.env.OPENAI_API_KEY) ||
      (transcriptionProvider === 'aws-transcribe' &&
        !!process.env.AWS_ACCESS_KEY_ID &&
        !!process.env.AWS_SECRET_ACCESS_KEY);

    if (forceRuleBased) {
      this.logger.log(
        'Rule-based mode enabled (FORCE_RULE_BASED=true). Using rule-based generation for testing.',
      );
    } else if (this.USE_REAL_AI) {
      this.logger.log('Real AI agents enabled');
    } else {
      this.logger.log(
        'OpenAI API key not configured. Using rule-based generation (suitable for testing).',
      );
    }

    if (this.USE_REAL_TRANSCRIPTION) {
      this.logger.log(
        `Real transcription enabled using provider: ${transcriptionProvider || 'whisper'}`,
      );
    } else {
      this.logger.log(
        'Using mock transcription (configure TRANSCRIPTION_PROVIDER to enable real transcription)',
      );
    }
  }

  async onModuleInit() {
    // Get the transcription provider
    try {
      this.transcriptionProvider = this.providerFactory.getProvider();
      this.logger.log('Transcription provider initialized');
    } catch (error: any) {
      this.logger.warn(`No transcription provider available: ${error.message}`);
      this.logger.warn('Falling back to mock transcription');
    }
  }

  async startSession(
    sessionId: string,
    callback: TranscriptionCallback,
  ): Promise<void> {
    // Stop existing session if any
    this.stopSession(sessionId);

    const useRealTranscription =
      this.USE_REAL_TRANSCRIPTION && this.transcriptionProvider !== null;

    const session: ActiveSession = {
      sessionId,
      callback,
      transcriptBuffer: [],
      fullTranscript: '',
      useRealTranscription,
    };

    this.activeSessions.set(sessionId, session);

    if (useRealTranscription && this.transcriptionProvider) {
      // Use real transcription provider
      try {
        await this.transcriptionProvider.startStreaming(
          sessionId,
          (result: TranscriptionResult) => {
            this.handleTranscriptionResult(sessionId, result);
          },
          (error: Error) => {
            this.logger.error(
              `Transcription error for session ${sessionId}: ${error.message}`,
            );
            // Fallback to mock on error
            this.simulateTranscription(sessionId);
          },
        );
        this.logger.log(`Real transcription started for session ${sessionId}`);
      } catch (error: any) {
        this.logger.error(
          `Failed to start real transcription: ${error.message}`,
        );
        this.logger.log('Falling back to mock transcription');
        this.simulateTranscription(sessionId);
      }
    } else {
      // Use mock transcription for testing
      this.simulateTranscription(sessionId);
    }
  }

  async stopSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);

    if (session) {
      // Stop mock transcription interval if running
      if (session.intervalId) {
        clearInterval(session.intervalId);
      }

      // Stop real transcription provider if running
      if (session.useRealTranscription && this.transcriptionProvider) {
        try {
          await this.transcriptionProvider.stopStreaming(sessionId);
          this.logger.log(
            `Real transcription stopped for session ${sessionId}`,
          );
        } catch (error: any) {
          this.logger.error(`Error stopping transcription: ${error.message}`);
        }
      }

      this.activeSessions.delete(sessionId);
    }
  }

  async processAudioChunk(
    sessionId: string,
    audioBuffer: Buffer,
  ): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      this.logger.warn(`No active session found for audio chunk: ${sessionId}`);
      return;
    }

    if (session.useRealTranscription && this.transcriptionProvider) {
      // Send audio chunk to real transcription provider
      try {
        await this.transcriptionProvider.processAudioChunk(
          sessionId,
          audioBuffer,
        );
      } catch (error: any) {
        this.logger.error(`Error processing audio chunk: ${error.message}`);
        // Fallback: store chunk for mock processing (base64)
        session.transcriptBuffer.push(audioBuffer.toString('base64'));
      }
    } else {
      // Store audio chunk for mock transcription (base64)
      session.transcriptBuffer.push(audioBuffer.toString('base64'));
    }
  }

  /**
   * Handle transcription result from real provider
   */
  private handleTranscriptionResult(
    sessionId: string,
    result: TranscriptionResult,
  ): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    // Accumulate full transcript
    if (result.text) {
      session.fullTranscript +=
        (session.fullTranscript ? ' ' : '') + result.text;
    }

    // Emit transcription event
    session.callback({
      type: result.isPartial ? 'transcription_partial' : 'transcription_final',
      sessionId,
      text: result.text,
      speaker: result.speaker || 'Unknown',
      timestamp: result.timestamp,
      confidence: result.confidence,
    });

    // Trigger AI processing for final results or after accumulating enough text
    if (!result.isPartial && session.fullTranscript.length > 50) {
      this.processWithAI(sessionId, session.fullTranscript);
    } else if (result.isPartial && session.fullTranscript.length > 200) {
      // Process partial results periodically if transcript is long enough
      this.processWithAI(sessionId, session.fullTranscript);
    }
  }

  private simulateTranscription(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    const mockTranscripts = [
      'Patient presents with',
      'Patient presents with chest pain',
      'Patient presents with chest pain and shortness of breath',
      'Vital signs are stable',
      'Vital signs are stable. Blood pressure 120/80',
      'Assessment: Possible cardiac event',
      'Plan: Order EKG and cardiac enzymes',
    ];

    let transcriptIndex = 0;
    let partialText = '';

    // Simulate partial transcription every 2 seconds
    session.intervalId = setInterval(() => {
      if (transcriptIndex >= mockTranscripts.length) {
        // Generate SOAP update after all transcripts are done
        if (
          transcriptIndex === mockTranscripts.length &&
          session.fullTranscript.length > 0
        ) {
          this.processWithAI(sessionId, session.fullTranscript);
        }
        return;
      }

      const currentTranscript = mockTranscripts[transcriptIndex];
      partialText = currentTranscript;

      // Emit partial transcription
      session.callback({
        type: 'transcription_partial',
        sessionId,
        text: partialText,
        speaker: transcriptIndex % 2 === 0 ? 'Doctor' : 'Patient',
        timestamp: Date.now(),
      });

      // Every 3rd transcript, emit final
      if ((transcriptIndex + 1) % 3 === 0) {
        // Accumulate full transcript
        session.fullTranscript +=
          (session.fullTranscript ? ' ' : '') + partialText;

        session.callback({
          type: 'transcription_final',
          sessionId,
          text: partialText,
          speaker: transcriptIndex % 2 === 0 ? 'Doctor' : 'Patient',
          timestamp: Date.now(),
        });
        partialText = '';

        // Trigger AI processing after accumulating enough text (every 6 transcripts = ~12 seconds)
        if (
          (transcriptIndex + 1) % 6 === 0 &&
          session.fullTranscript.length > 50
        ) {
          this.processWithAI(sessionId, session.fullTranscript);
        }
      }

      transcriptIndex++;
    }, 2000);
  }

  /**
   * Process transcription with AI agents
   */
  private async processWithAI(
    sessionId: string,
    transcriptionText: string,
  ): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    try {
      // Get existing SOAP notes if any
      const existingNotes = await this.notesService.getNotes(sessionId);
      const existingSOAP = existingNotes.soap;

      // Use agent orchestrator to process transcription
      const result = await this.agentOrchestrator.processTranscription(
        transcriptionText,
        sessionId,
        existingSOAP.subjective ||
          existingSOAP.objective ||
          existingSOAP.assessment ||
          existingSOAP.plan
          ? existingSOAP
          : undefined,
      );

      // Update SOAP notes if generated
      if (result.soapNotes) {
        await this.notesService.updateNotesFromWebSocket(
          sessionId,
          result.soapNotes,
        );

        // Emit SOAP update
        session.callback({
          type: 'soap_update',
          sessionId,
          soap: result.soapNotes,
        });

        this.logger.log(`SOAP notes updated for session ${sessionId}`);
      }

      // Generate alerts if any
      if (result.alerts && result.alerts.length > 0) {
        for (const alertData of result.alerts) {
          const alert = this.alertsService.createAlert(
            alertData.severity,
            alertData.message,
          );

          // Emit alert
          session.callback({
            type: 'alert',
            alert: {
              id: alert.id,
              severity: alert.severity,
              message: alert.message,
              timestamp: alert.timestamp,
              category: alertData.category,
              recommendations: alertData.recommendations,
            },
          });
        }

        this.logger.log(
          `Generated ${result.alerts.length} alerts for session ${sessionId}`,
        );
      }
    } catch (error: any) {
      this.logger.error(
        `AI processing failed for session ${sessionId}: ${error.message}`,
        error.stack,
      );

      // Fallback to mock generation on error
      await this.generateSOAPUpdateFallback(sessionId, transcriptionText);
    }
  }

  /**
   * Fallback: Generate mock SOAP update (when AI is unavailable or fails)
   */
  private async generateSOAPUpdateFallback(
    sessionId: string,
    transcriptionText: string,
  ): Promise<void> {
    const soapUpdate = {
      subjective:
        transcriptionText.includes('patient') ||
        transcriptionText.includes('reports')
          ? transcriptionText
          : 'Patient information recorded',
      objective: 'Vital signs and findings mentioned in conversation',
      assessment: 'Assessment based on conversation',
      plan: 'Plan to be determined based on assessment',
    };

    await this.notesService.updateNotesFromWebSocket(sessionId, soapUpdate);

    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.callback({
        type: 'soap_update',
        sessionId,
        soap: soapUpdate,
      });
    }

    // Generate basic alert
    const alert = this.alertsService.createAlert(
      'info',
      `SOAP notes generated for session ${sessionId}. Please review.`,
    );

    if (session) {
      session.callback({
        type: 'alert',
        alert: {
          id: alert.id,
          severity: alert.severity,
          message: alert.message,
          timestamp: alert.timestamp,
        },
      });
    }
  }
}
