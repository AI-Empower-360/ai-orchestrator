import { Injectable, NotFoundException } from '@nestjs/common';
import { SOAPNotesDto, SOAPNotesResponseDto } from '../common/dto/soap-notes.dto';
import { Session } from '../common/interfaces/session.interface';

// Mock session storage (replace with real database)
const sessions: Map<string, Session> = new Map();

@Injectable()
export class NotesService {
  async getNotes(sessionId: string): Promise<SOAPNotesResponseDto> {
    const session = sessions.get(sessionId);
    
    if (!session) {
      // Return empty notes for new sessions
      return {
        sessionId,
        soap: {
          subjective: '',
          objective: '',
          assessment: '',
          plan: '',
        },
        updatedAt: new Date().toISOString(),
      };
    }

    return {
      sessionId: session.id,
      soap: session.soap,
      updatedAt: session.updatedAt.toISOString(),
    };
  }

  async updateNotes(
    sessionId: string,
    soap: SOAPNotesDto,
  ): Promise<SOAPNotesResponseDto> {
    const existingSession = sessions.get(sessionId);
    
    const session: Session = existingSession
      ? {
          ...existingSession,
          soap: { ...existingSession.soap, ...soap },
          updatedAt: new Date(),
        }
      : {
          id: sessionId,
          doctorId: '1', // Mock doctor ID
          soap: {
            subjective: '',
            objective: '',
            assessment: '',
            plan: '',
            ...soap,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };

    sessions.set(sessionId, session);

    return {
      sessionId: session.id,
      soap: session.soap,
      updatedAt: session.updatedAt.toISOString(),
    };
  }

  // Internal method for WebSocket updates
  async updateNotesFromWebSocket(
    sessionId: string,
    soap: SOAPNotesDto,
  ): Promise<void> {
    await this.updateNotes(sessionId, soap);
  }
}
