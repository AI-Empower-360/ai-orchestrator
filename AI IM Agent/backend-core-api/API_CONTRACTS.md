# Backend API Contracts

This document matches the frontend `API_CONTRACTS.md` and defines the exact backend implementation.

## REST API Endpoints

### Authentication

#### `POST /auth/login`
**Request:**
```typescript
{
  email: string;
  password: string;
}
```

**Response (200):**
```typescript
{
  token: string; // JWT
  doctor: {
    id: string;
    name: string;
    email: string;
  }
}
```

**Error (401):**
```typescript
{
  statusCode: 401;
  message: "Invalid email or password";
  error: "Unauthorized";
}
```

### SOAP Notes

#### `GET /api/notes/:sessionId`
**Headers:** `Authorization: Bearer {JWT}`

**Response (200):**
```typescript
{
  sessionId: string;
  soap: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  updatedAt: string; // ISO 8601
}
```

**Response (404):** Returns empty SOAP notes for new sessions

#### `PATCH /api/notes/:sessionId`
**Headers:** `Authorization: Bearer {JWT}`

**Request:**
```typescript
{
  soap: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
  };
}
```

**Response (200):**
```typescript
{
  sessionId: string;
  soap: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  updatedAt: string; // ISO 8601
}
```

### Alerts

#### `GET /api/alerts`
**Headers:** `Authorization: Bearer {JWT}`

**Response (200):**
```typescript
{
  alerts: Array<{
    id: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    timestamp: string; // ISO 8601
    acknowledged: boolean;
  }>;
}
```

#### `POST /api/alerts/:alertId/acknowledge`
**Headers:** `Authorization: Bearer {JWT}`

**Response (200):**
```typescript
{
  success: boolean;
}
```

**Error (404):**
```typescript
{
  statusCode: 404;
  message: "Alert with ID {alertId} not found";
  error: "Not Found";
}
```

## WebSocket API

### Connection

**URL:** `ws://localhost:3001/ws/transcription?token={JWT}`

**Authentication:** JWT token required in query parameter

### Client → Server Events

#### `start_recording`
```typescript
{
  type: 'start_recording';
  sessionId: string;
}
```

#### `audio_chunk`
```typescript
{
  type: 'audio_chunk';
  sessionId: string;
  chunk: string; // Base64 encoded audio data
  timestamp: number;
}
```

#### `stop_recording`
```typescript
{
  type: 'stop_recording';
  sessionId: string;
}
```

### Server → Client Events

#### `transcription_partial`
```typescript
{
  type: 'transcription_partial';
  sessionId: string;
  text: string;
  speaker?: string;
  timestamp: number;
}
```

#### `transcription_final`
```typescript
{
  type: 'transcription_final';
  sessionId: string;
  text: string;
  speaker: string;
  timestamp: number;
}
```

#### `soap_update`
```typescript
{
  type: 'soap_update';
  sessionId: string;
  soap: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
  };
}
```

#### `alert`
```typescript
{
  type: 'alert';
  alert: {
    id: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    timestamp: string;
  };
}
```

#### `error`
```typescript
{
  type: 'error';
  message: string;
  code?: string;
}
```

#### `connection_status`
```typescript
{
  type: 'connection_status';
  status: 'connected' | 'disconnected' | 'reconnecting';
}
```

## Implementation Notes

### Mock Services

The backend includes mock implementations for:
- **Authentication**: Mock doctor database
- **Transcription**: Simulated transcription events
- **SOAP Notes**: In-memory storage
- **Alerts**: In-memory storage

### Production Replacements

For production, replace:
- Mock doctor database → Real database (PostgreSQL)
- Mock transcription → AWS Transcribe or similar
- In-memory storage → Database persistence
- Mock SOAP generation → AI agent service

### Security

- All REST endpoints require JWT authentication (except `/auth/login`)
- WebSocket connections require JWT in query parameter
- CORS configured for frontend origin only
- JWT expiration: 24 hours
