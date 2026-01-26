# Backend Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd ai-med-backend
npm install
```

### 2. Configure Environment

Create `.env` file:

```env
PORT=3001
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### 3. Start Server

```bash
npm run start:dev
```

Server will start on `http://localhost:3001`

## Testing the Backend

### Test Login Endpoint

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@example.com","password":"password123"}'
```

### Test WebSocket Connection

The frontend will automatically connect when you start recording.

For manual testing, use a WebSocket client or the frontend.

## Mock Data

### Doctor Credentials
- **Email**: `doctor@example.com`
- **Password**: `password123`

### Mock Transcription

The backend includes a mock transcription service that:
- Simulates partial and final transcriptions
- Generates SOAP notes updates
- Creates clinical alerts

This allows full end-to-end testing without real transcription services.

## Integration with Frontend

1. **Start Backend:**
   ```bash
   cd ai-med-backend
   npm run start:dev
   ```

2. **Start Frontend:**
   ```bash
   cd ai-med-frontend
   npm run dev
   ```

3. **Test Flow:**
   - Open http://localhost:3000
   - Login with `doctor@example.com` / `password123`
   - Start recording
   - See live transcription and SOAP updates

## Troubleshooting

### Port Already in Use
Change `PORT` in `.env` file.

### CORS Errors
Ensure `FRONTEND_URL` in `.env` matches your frontend URL.

### WebSocket Connection Failed
- Verify backend is running
- Check JWT token is valid
- Ensure WebSocket path is correct: `/ws/transcription`

### Module Not Found Errors
Run `npm install` to ensure all dependencies are installed.
