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
import { debugLog } from '../common/debug-logger';

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
    // #region agent log
    debugLog('transcription.gateway.ts:50', 'WebSocket connection attempt', { socketId: client.id, hasQuery: !!client.handshake.query, hasAuth: !!client.handshake.auth }, 'G');
    // #endregion
    try {
      // Extract token from query or auth (Socket.io can use both)
      const token = (client.handshake.query.token as string) || 
                    (client.handshake.auth?.token as string) ||
                    (client.handshake.auth as any)?.token;
      // #region agent log
      debugLog('transcription.gateway.ts:56', 'Token extracted', { hasToken: !!token, tokenLength: token?.length, fromQuery: !!client.handshake.query.token, fromAuth: !!client.handshake.auth?.token }, 'G');
      // #endregion
      if (!token) {
        // #region agent log
        debugLog('transcription.gateway.ts:60', 'No token provided', { socketId: client.id, queryKeys: Object.keys(client.handshake.query), authKeys: Object.keys(client.handshake.auth || {}) }, 'G');
        // #endregion
        client.disconnect();
        return;
      }

      // Verify JWT
      // #region agent log
      debugLog('transcription.gateway.ts:64', 'Verifying JWT', { hasToken: !!token }, 'G');
      // #endregion
      const payload = this.jwtService.verify(token);
      const doctor = await this.authService.validateToken(payload);
      // #region agent log
      debugLog('transcription.gateway.ts:67', 'Token validation result', { hasDoctor: !!doctor, doctorId: doctor?.id }, 'G');
      // #endregion
      if (!doctor) {
        // #region agent log
        debugLog('transcription.gateway.ts:70', 'Doctor validation failed', { socketId: client.id }, 'G');
        // #endregion
        client.disconnect();
        return;
      }

      client.doctorId = doctor.id;

      // Send connection status
      client.emit('connection_status', {
        type: 'connection_status',
        status: 'connected',
      });

      // #region agent log
      debugLog('transcription.gateway.ts:82', 'WebSocket connected successfully', { socketId: client.id, doctorId: doctor.id, doctorEmail: doctor.email }, 'G');
      // #endregion
      console.log(`Client connected: ${client.id} (Doctor: ${doctor.email})`);
    } catch (error: any) {
      // #region agent log
      debugLog('transcription.gateway.ts:87', 'WebSocket connection error', { error: error.message, stack: error.stack }, 'G');
      // #endregion
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
    this.transcriptionService.startSession(sessionId, (events) => {
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
    });

    console.log(`Recording started for session: ${sessionId}`);
  }

  @SubscribeMessage('audio_chunk')
  async handleAudioChunk(
    @MessageBody() data: { type: string; sessionId: string; chunk: string; timestamp: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.sessionId) {
      return;
    }

    // Decode base64 audio chunk
    const audioBuffer = Buffer.from(data.chunk, 'base64');

    // Process audio chunk (mock transcription for now)
    this.transcriptionService.processAudioChunk(
      client.sessionId,
      audioBuffer,
    );
  }

  @SubscribeMessage('stop_recording')
  async handleStopRecording(
    @MessageBody() data: { type: string; sessionId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const { sessionId } = data;

    // Stop transcription service
    this.transcriptionService.stopSession(sessionId);

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
