# WebSocket Compatibility Note

## Current Situation

- **Frontend**: Uses native WebSocket API (`new WebSocket()`)
- **Backend**: Uses Socket.io (NestJS default)

These are **incompatible** by default. You have two options:

## Option 1: Update Frontend to Use Socket.io Client (Recommended for MVP)

**Easier and faster for MVP**

1. Install Socket.io client in frontend:
   ```bash
   cd ai-med-frontend
   npm install socket.io-client
   ```

2. Update `lib/websocket.ts` to use Socket.io client instead of native WebSocket

3. Backend works as-is

**Pros:**
- Quick to implement
- Better reconnection handling
- Room support if needed later

**Cons:**
- Adds dependency to frontend
- Slightly larger bundle size

## Option 2: Update Backend to Use Native WebSocket

**More work but keeps frontend as-is**

1. Remove Socket.io from backend
2. Use `@nestjs/platform-ws` (native WebSocket adapter)
3. Rewrite gateway to use native WebSocket

**Pros:**
- No frontend changes
- Smaller bundle size
- Native browser API

**Cons:**
- More complex implementation
- Manual reconnection logic needed
- Less features out of the box

## Recommended: Option 1 for MVP

For fastest MVP, update the frontend to use Socket.io client. The backend is already set up and working.

### Quick Frontend Update

Replace `lib/websocket.ts` WebSocket implementation with Socket.io client.

**Ask Cursor:**
> Update the frontend WebSocket client to use Socket.io-client instead of native WebSocket.
> Maintain the same interface and event handling.
> Ensure compatibility with the NestJS Socket.io backend.

## Testing

After updating, test the connection:

1. Start backend: `npm run start:dev`
2. Start frontend: `npm run dev`
3. Login and start recording
4. Verify WebSocket connection in browser DevTools
5. Check for transcription events
