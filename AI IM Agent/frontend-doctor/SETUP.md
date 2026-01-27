# Quick Setup Guide

## Environment Variables

Create a `.env.local` file in the root directory with the following:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001

# WebSocket Configuration (optional - defaults to API_BASE_URL)
NEXT_PUBLIC_WS_BASE_URL=ws://localhost:3001

# Environment
NODE_ENV=development
```

## Installation Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment file:**
   ```bash
   # Copy this content to .env.local
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
   NEXT_PUBLIC_WS_BASE_URL=ws://localhost:3001
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   Navigate to http://localhost:3000

## Backend Connection

Ensure your backend API is running and accessible at the URL specified in `NEXT_PUBLIC_API_BASE_URL`.

The frontend expects:
- REST API at the base URL
- WebSocket server at `/ws/transcription` endpoint

See `API_CONTRACTS.md` for detailed API specifications.

## Troubleshooting

### Port Already in Use
If port 3000 is in use, Next.js will automatically use the next available port.

### WebSocket Connection Failed
- Verify backend WebSocket server is running
- Check `NEXT_PUBLIC_WS_BASE_URL` is correct
- Ensure WebSocket uses `ws://` (dev) or `wss://` (production)

### API Errors
- Verify backend API is running
- Check `NEXT_PUBLIC_API_BASE_URL` is correct
- Ensure CORS is configured on backend

### Microphone Access
- Browser will prompt for microphone permission
- Ensure microphone is connected and working
- Check browser permissions in settings
