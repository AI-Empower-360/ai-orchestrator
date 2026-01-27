# AI Med Backend

NestJS backend API for the AI Agentic Internal Medicine platform. Provides REST APIs and WebSocket server for real-time transcription, SOAP notes, and clinical alerts.

## 🎯 Features

- **Authentication**: JWT-based doctor authentication
- **REST API**: SOAP notes and alerts management
- **WebSocket Gateway**: Real-time transcription and live updates
- **Mock Services**: Simulated transcription for development/testing
- **HIPAA-Aware**: Secure token handling, no PHI in logs

## 🛠 Tech Stack

- **Framework**: NestJS 10
- **Language**: TypeScript
- **WebSocket**: Socket.io
- **Authentication**: JWT (Passport)
- **Validation**: class-validator, class-transformer

## 📁 Project Structure

```
src/
├── auth/                    # Authentication module
│   ├── auth.controller.ts   # Login endpoint
│   ├── auth.service.ts      # Auth logic
│   ├── jwt.strategy.ts      # JWT strategy
│   └── auth.module.ts
├── notes/                   # SOAP notes module
│   ├── notes.controller.ts   # GET, PATCH /api/notes/:sessionId
│   ├── notes.service.ts     # Notes business logic
│   └── notes.module.ts
├── alerts/                   # Clinical alerts module
│   ├── alerts.controller.ts  # GET, POST /api/alerts
│   ├── alerts.service.ts    # Alerts business logic
│   └── alerts.module.ts
├── transcription/            # WebSocket transcription
│   ├── transcription.gateway.ts  # WebSocket gateway
│   ├── transcription.service.ts  # Transcription logic
│   └── transcription.module.ts
├── common/                   # Shared code
│   ├── dto/                  # Data Transfer Objects
│   └── interfaces/          # TypeScript interfaces
├── app.module.ts            # Root module
└── main.ts                  # Application entry point
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Clone and install:**
   ```bash
   cd ai-med-backend
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env`:
   ```env
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   ```

3. **Start development server:**
   ```bash
   npm run start:dev
   ```

4. **Verify:**
   - API: http://localhost:3001
   - WebSocket: ws://localhost:3001/ws/transcription

## 📡 API Endpoints

### Authentication

#### `POST /auth/login`
```json
{
  "email": "doctor@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "doctor": {
    "id": "1",
    "name": "Dr. John Smith",
    "email": "doctor@example.com"
  }
}
```

### SOAP Notes

#### `GET /api/notes/:sessionId`
Returns SOAP notes for a session.

#### `PATCH /api/notes/:sessionId`
Updates SOAP notes.

**Request:**
```json
{
  "soap": {
    "subjective": "Patient reports...",
    "objective": "Vital signs...",
    "assessment": "Diagnosis...",
    "plan": "Treatment plan..."
  }
}
```

### Alerts

#### `GET /api/alerts`
Returns all clinical alerts.

#### `POST /api/alerts/:alertId/acknowledge`
Acknowledges an alert.

## 🔌 WebSocket API

### Connection

```
ws://localhost:3001/ws/transcription?token={JWT}
```

### Client → Server Events

#### `start_recording`
```json
{
  "type": "start_recording",
  "sessionId": "session-123"
}
```

#### `audio_chunk`
```json
{
  "type": "audio_chunk",
  "sessionId": "session-123",
  "chunk": "base64-encoded-audio-data",
  "timestamp": 1234567890
}
```

#### `stop_recording`
```json
{
  "type": "stop_recording",
  "sessionId": "session-123"
}
```

### Server → Client Events

- `transcription_partial` - Partial transcription text
- `transcription_final` - Final transcription text
- `soap_update` - SOAP notes update
- `alert` - Clinical alert
- `error` - Error message
- `connection_status` - Connection status

See `API_CONTRACTS.md` in frontend repo for detailed schemas.

## 🧪 Testing

### Mock Credentials

For development, use:
- **Email**: `doctor@example.com`
- **Password**: `password123`

### Test WebSocket Connection

```javascript
const io = require('socket.io-client');
const token = 'your-jwt-token';

const socket = io('http://localhost:3001/ws/transcription', {
  query: { token },
});

socket.on('connect', () => {
  console.log('Connected!');
  socket.emit('start_recording', {
    type: 'start_recording',
    sessionId: 'test-session-123',
  });
});

socket.on('transcription_partial', (data) => {
  console.log('Partial:', data);
});

socket.on('soap_update', (data) => {
  console.log('SOAP Update:', data);
});
```

## 🔐 Security

- JWT tokens with 24h expiration
- CORS configured for frontend origin
- WebSocket authentication required
- No PHI in logs or error messages

## 🔄 Integration with Frontend

This backend is designed to work with:
- **Frontend**: [ai-med-frontend](https://github.com/AI-Empower-360/ai-med-frontend)
- **API Contracts**: See frontend's `API_CONTRACTS.md`

### Development Workflow

1. Start backend: `npm run start:dev` (port 3001)
2. Start frontend: `npm run dev` (port 3000)
3. Frontend connects to `http://localhost:3001`

## 🚧 Future Enhancements

- [ ] Real database integration (PostgreSQL)
- [ ] AWS Transcribe integration
- [ ] Real-time AI SOAP note generation
- [ ] Patient data management
- [ ] Audit logging
- [ ] Rate limiting
- [ ] API versioning

## 📝 Development

### Available Scripts

- `npm run start` - Start production server
- `npm run start:dev` - Start development server (watch mode)
- `npm run start:debug` - Start with debugger
- `npm run build` - Build for production
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run e2e tests
- `npm run lint` - Run ESLint

## 📚 Documentation

Comprehensive documentation is available for all aspects of the AI Orchestrator:

### Core Documentation

- **[SETUP.md](./SETUP.md)** - Detailed setup and configuration guide
- **[QUICK_START.md](./QUICK_START.md)** - Quick start guide for new developers
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide for all platforms
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions
- **[API_CONTRACTS.md](./API_CONTRACTS.md)** - API contracts and WebSocket schemas
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Testing guide and best practices
- **[WEBSOCKET_COMPATIBILITY.md](./WEBSOCKET_COMPATIBILITY.md)** - WebSocket compatibility guide

### Documentation Index

For a complete overview of all documentation, see **[docs/INDEX.md](./docs/INDEX.md)**.

### Quick Links

- **Setting up?** → [SETUP.md](./SETUP.md)
- **Deploying?** → [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Having issues?** → [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **API Integration?** → [API_CONTRACTS.md](./API_CONTRACTS.md)

## 📄 License

MIT

## 🔗 Related Repositories

- **Frontend**: [ai-med-frontend](https://github.com/AI-Empower-360/ai-med-frontend)
- **Backend**: [ai-med-backend](https://github.com/AI-Empower-360/ai-med-backend)
- **Agents**: [ai-med-agents](https://github.com/AI-Empower-360/ai-med-agents) (Future)
- **Infrastructure**: [ai-med-infrastructure](https://github.com/AI-Empower-360/ai-med-infrastructure) (Future)
