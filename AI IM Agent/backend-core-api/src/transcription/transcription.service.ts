import { Injectable } from '@nestjs/common';
import { NotesService } from '../notes/notes.service';
import { AlertsService } from '../alerts/alerts.service';

interface TranscriptionCallback {
  (event: any): void;
}

interface ActiveSession {
  sessionId: string;
  callback: TranscriptionCallback;
  intervalId?: NodeJS.Timeout;
  transcriptBuffer: string[];
}

@Injectable()
export class TranscriptionService {
  private activeSessions: Map<string, ActiveSession> = new Map();

  constructor(
    private notesService: NotesService,
    private alertsService: AlertsService,
  ) {}

  startSession(sessionId: string, callback: TranscriptionCallback): void {
    // Stop existing session if any
    this.stopSession(sessionId);

    const session: ActiveSession = {
      sessionId,
      callback,
      transcriptBuffer: [],
    };

    this.activeSessions.set(sessionId, session);

    // Simulate transcription events (replace with real transcription service)
    this.simulateTranscription(sessionId);
  }

  stopSession(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session?.intervalId) {
      clearInterval(session.intervalId);
    }
    this.activeSessions.delete(sessionId);
  }

  processAudioChunk(sessionId: string, audioBuffer: Buffer): void {
    // In production, this would:
    // 1. Send audio to transcription service (AWS Transcribe, etc.)
    // 2. Receive transcription results
    // 3. Process and emit events

    // For now, we simulate transcription in simulateTranscription()
    const session = this.activeSessions.get(sessionId);
    if (session) {
      // Store audio chunk for processing
      // In real implementation, this would queue for transcription
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
        // Generate SOAP update after some transcripts
        if (transcriptIndex === mockTranscripts.length) {
          this.generateSOAPUpdate(sessionId);
          this.generateAlert(sessionId);
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
        session.callback({
          type: 'transcription_final',
          sessionId,
          text: partialText,
          speaker: transcriptIndex % 2 === 0 ? 'Doctor' : 'Patient',
          timestamp: Date.now(),
        });
        partialText = '';
      }

      transcriptIndex++;
    }, 2000);
  }

  private async generateSOAPUpdate(sessionId: string): Promise<void> {
    // Simulate AI-generated SOAP notes
    const soapUpdate = {
      subjective: 'Patient reports chest pain and shortness of breath',
      objective: 'Vital signs stable. BP 120/80, HR 72, O2 sat 98%',
      assessment: 'Possible cardiac event, rule out MI',
      plan: 'Order EKG, cardiac enzymes, chest X-ray. Follow up in 24 hours',
    };

    // Update notes in database
    await this.notesService.updateNotesFromWebSocket(sessionId, soapUpdate);

    // Emit SOAP update to all clients in session
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.callback({
        type: 'soap_update',
        sessionId,
        soap: soapUpdate,
      });
    }
  }

  private generateAlert(sessionId: string): void {
    // Simulate clinical alert
    const alert = this.alertsService.createAlert(
      'warning',
      `New SOAP notes generated for session ${sessionId}. Please review.`,
    );

    // Emit alert to all clients in session
    const session = this.activeSessions.get(sessionId);
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
