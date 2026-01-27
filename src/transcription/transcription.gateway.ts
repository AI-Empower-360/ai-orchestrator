import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth/auth.service';
import { NotesService } from '../notes/notes.service';
import { AlertsService } from '../alerts/alerts.service';
import { TranscriptionService } from './transcription.service';

interface AuthenticatedSocket extends Socket {
  doctorId?: string;
  sessionId?: string;
  handshake: Socket['handshake'] & {
    query: {
      token?: string;
    };
  };
}

@WebSocketGateway({
  namespace: '/ws/transcription',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class TranscriptionGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private activeSessions: Map<string, Set<string>> = new Map(); // sessionId -> Set of socketIds

  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
    private notesService: NotesService,
    private alertsService: AlertsService,
    private transcriptionService: TranscriptionService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        (client.handshake.query.token as string) ||
        (client.handshake.auth?.token as string) ||
        (client.handshake.auth as any)?.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const doctor = await this.authService.validateToken(payload);
      if (!doctor) {
        client.disconnect();
        return;
      }

      client.doctorId = doctor.id;
      client.emit('connection_status', {
        type: 'connection_status',
        status: 'connected',
      });
      console.log(`Client connected: ${client.id} (Doctor: ${doctor.email})`);
    } catch (error: any) {
      console.error('WebSocket connection error:', error);
      client.emit('error', {
        type: 'error',
        message: 'Authentication failed',
        code: 'AUTH_ERROR',
      });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.sessionId) {
      const sessionSockets = this.activeSessions.get(client.sessionId);
      if (sessionSockets) {
        sessionSockets.delete(client.id);
        if (sessionSockets.size === 0) {
          this.activeSessions.delete(client.sessionId);
        }
      }
    }

    client.emit('connection_status', {
      type: 'connection_status',
      status: 'disconnected',
    });

    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('start_recording')
  async handleStartRecording(
    @MessageBody() data: { type: string; sessionId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const { sessionId } = data;
    client.sessionId = sessionId;

    // Track active session
    if (!this.activeSessions.has(sessionId)) {
      this.activeSessions.set(sessionId, new Set());
    }
    this.activeSessions.get(sessionId)!.add(client.id);

    // Start transcription service for this session
    this.transcriptionService
      .startSession(sessionId, (events) => {
        // Broadcast to all clients in this session
        const sessionClients = this.activeSessions.get(sessionId);
        if (sessionClients) {
          sessionClients.forEach((socketId) => {
            const socket = this.server.sockets.sockets.get(socketId);
            if (socket) {
              socket.emit(events.type, events);
            }
          });
        }
      })
      .catch((error) => {
        console.error(
          `Failed to start transcription session ${sessionId}:`,
          error,
        );
        client.emit('error', {
          type: 'error',
          message: 'Failed to start transcription',
          code: 'TRANSCRIPTION_ERROR',
        });
      });

    console.log(`Recording started for session: ${sessionId}`);
  }

  @SubscribeMessage('audio_chunk')
  async handleAudioChunk(
    @MessageBody()
    data: { type: string; sessionId: string; chunk: string; timestamp: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.sessionId) {
      return;
    }

    // Decode base64 audio chunk
    const audioBuffer = Buffer.from(data.chunk, 'base64');

    // Process audio chunk with real transcription provider
    this.transcriptionService
      .processAudioChunk(client.sessionId, audioBuffer)
      .catch((error) => {
        console.error(
          `Error processing audio chunk for session ${client.sessionId}:`,
          error,
        );
      });
  }

  @SubscribeMessage('stop_recording')
  async handleStopRecording(
    @MessageBody() data: { type: string; sessionId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const { sessionId } = data;

    // Stop transcription service
    this.transcriptionService.stopSession(sessionId).catch((error) => {
      console.error(
        `Error stopping transcription session ${sessionId}:`,
        error,
      );
    });

    // Remove from active sessions
    if (this.activeSessions.has(sessionId)) {
      this.activeSessions.get(sessionId)!.delete(client.id);
      if (this.activeSessions.get(sessionId)!.size === 0) {
        this.activeSessions.delete(sessionId);
      }
    }

    console.log(`Recording stopped for session: ${sessionId}`);
  }
}
