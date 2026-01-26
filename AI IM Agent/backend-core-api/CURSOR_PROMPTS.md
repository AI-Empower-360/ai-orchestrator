# Exact Cursor Prompts - What to Ask Next

## 🎯 Priority 1: Fix WebSocket Compatibility (DO THIS FIRST)

The frontend uses native WebSocket, but the backend uses Socket.io. They're incompatible.

### Ask Cursor:

> Update the frontend WebSocket client in `ai-med-frontend/lib/websocket.ts` to use Socket.io-client instead of native WebSocket.
> 
> Requirements:
> - Install `socket.io-client` package
> - Maintain the same interface (connect, disconnect, sendAudioChunk, on events)
> - Keep all existing event handlers
> - Ensure compatibility with NestJS Socket.io backend at `ws://localhost:3001/ws/transcription`
> - Keep auto-reconnect logic
> - Update connection URL format for Socket.io

**Why:** This is blocking end-to-end testing. Do this first.

---

## 🎯 Priority 2: Test End-to-End Flow

After fixing WebSocket, verify everything works.

### Ask Cursor:

> Create a test script that verifies the complete frontend-backend integration:
> 
> 1. Test login endpoint returns JWT
> 2. Test WebSocket connection with JWT
> 3. Test start_recording event
> 4. Test audio_chunk events
> 5. Test transcription events received
> 6. Test SOAP update events
> 7. Test stop_recording event
> 
> Use a simple Node.js script or add to frontend test suite.

**Why:** Ensures everything works before moving forward.

---

## 🎯 Priority 3: Database Integration

Replace mock storage with real database.

### Ask Cursor:

> Replace mock in-memory storage in the backend with PostgreSQL using Prisma.
> 
> Requirements:
> - Install Prisma and configure PostgreSQL connection
> - Create schema for: doctors, sessions, soap_notes, alerts
> - Update AuthService to use database instead of MOCK_DOCTORS array
> - Update NotesService to use database instead of Map
> - Update AlertsService to use database instead of Map
> - Add database migrations
> - Keep mock data seeding for development
> - Update .env.example with DATABASE_URL

**Why:** Needed for real data persistence. Critical for production.

---

## 🎯 Priority 4: Real Transcription Service

Replace mock transcription with AWS Transcribe.

### Ask Cursor:

> Replace the mock transcription service in `src/transcription/transcription.service.ts` with AWS Transcribe integration.
> 
> Requirements:
> - Install AWS SDK
> - Configure AWS credentials (use environment variables)
> - Implement real-time streaming transcription
> - Process audio chunks from WebSocket
> - Emit transcription_partial and transcription_final events
> - Handle errors gracefully
> - Add cost monitoring
> - Keep mock mode for development (use env flag)

**Why:** Core feature. Mock is fine for testing, but real transcription is MVP requirement.

---

## 🎯 Priority 5: AI SOAP Note Generation

Generate SOAP notes from transcriptions.

### Ask Cursor:

> Implement AI-powered SOAP note generation in the backend.
> 
> Requirements:
> - Create a new service `soap-generation.service.ts`
> - Integrate with OpenAI or Anthropic API
> - Accept transcription text as input
> - Generate structured SOAP notes (Subjective, Objective, Assessment, Plan)
> - Call this service when transcription reaches certain length
> - Emit soap_update events via WebSocket
> - Handle API errors and rate limits
> - Add prompt engineering for medical context
> - Use environment variables for API keys

**Why:** Key differentiator. AI-generated SOAP notes are the main value proposition.

---

## 🎯 Priority 6: Production Hardening

Add production-ready features.

### Ask Cursor:

> Add production-grade features to the NestJS backend:
> 
> 1. Rate limiting (use @nestjs/throttler)
> 2. Request logging middleware
> 3. Health check endpoint at /health
> 4. Error monitoring (Sentry integration)
> 5. Environment variable validation on startup
> 6. Graceful shutdown handling
> 7. Request ID tracking
> 8. API response time logging
> 
> Keep development mode simple, but add production features behind env flags.

**Why:** Required for production deployment. Prevents issues later.

---

## 🎯 Priority 7: Testing Suite

Add comprehensive tests.

### Ask Cursor:

> Create a comprehensive test suite for the backend:
> 
> 1. Unit tests for all services (AuthService, NotesService, AlertsService, TranscriptionService)
> 2. Integration tests for all REST endpoints
> 3. WebSocket gateway tests
> 4. E2E tests for complete flows
> 5. Mock database for testing
> 6. Test coverage > 80%
> 
> Use Jest and Supertest. Add to package.json scripts.

**Why:** Ensures reliability and prevents regressions.

---

## 🎯 Priority 8: Documentation

Complete API documentation.

### Ask Cursor:

> Generate comprehensive API documentation using Swagger/OpenAPI:
> 
> - Install @nestjs/swagger
> - Add decorators to all controllers
> - Document all DTOs
> - Add example requests/responses
> - Include WebSocket event documentation
> - Generate interactive API docs at /api/docs
> - Export OpenAPI spec

**Why:** Essential for frontend developers and future integrations.

---

## 📋 Recommended Order

1. **Fix WebSocket** (30 min) - Blocking issue
2. **Test E2E** (1 hour) - Verify everything works
3. **Database** (2-3 days) - Foundation for everything
4. **Real Transcription** (3-4 days) - Core feature
5. **AI SOAP** (3-4 days) - Key differentiator
6. **Production Hardening** (2-3 days) - Deployment ready
7. **Testing** (2-3 days) - Quality assurance
8. **Documentation** (1-2 days) - Developer experience

**Total: ~2-3 weeks to production-ready backend**

---

## 🚀 Quick Wins (Do Anytime)

These are small improvements you can ask for anytime:

### Add Health Check

> Add a health check endpoint at GET /health that returns server status, database connection status, and timestamp.

### Add Request Logging

> Add request logging middleware that logs all API requests with method, path, status code, and response time.

### Improve Error Messages

> Improve error messages throughout the backend to be more user-friendly and include error codes for frontend handling.

### Add API Versioning

> Add API versioning to all endpoints (e.g., /api/v1/notes) to support future changes.

---

## 💡 Pro Tips

1. **One prompt at a time** - Don't combine multiple requests
2. **Be specific** - Include file paths and requirements
3. **Review before accepting** - Check generated code
4. **Test immediately** - Verify each change works
5. **Commit often** - Save progress after each major change

---

## 📞 Need Help?

- See `README.md` for overview
- See `SETUP.md` for setup instructions
- See `NEXT_STEPS.md` for development roadmap
- See `MVP_EXECUTION_PLAN.md` for 12-week plan
- See `API_CONTRACTS.md` for API specifications
