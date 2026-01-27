# API Contracts & WebSocket Schemas

## REST API Endpoints

### Authentication

#### POST /auth/login
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
  error: string;
  message: string;
}
```

### SOAP Notes

#### GET /api/notes/:sessionId
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

#### PATCH /api/notes/:sessionId
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

### Alerts

#### GET /api/alerts
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

#### POST /api/alerts/:alertId/acknowledge
**Response (200):**
```typescript
{
  success: boolean;
}
```

## WebSocket Events

### Connection
**URL:** `wss://api.example.com/ws/transcription?token={JWT}`

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
  chunk: ArrayBuffer; // Base64 encoded audio data
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
