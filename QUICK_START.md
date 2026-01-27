# Quick Start - Get Backend Running in 5 Minutes

## Prerequisites

- Node.js 18+ installed
- npm or yarn

## Steps

### 1. Install Dependencies

```bash
cd ai-med-backend
npm install
```

### 2. Create Environment File

Create `.env` in the root directory:

```env
PORT=3001
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### 3. Start Server

```bash
npm run start:dev
```

You should see:
```
🚀 Backend server running on http://localhost:3001
```

### 4. Test Login

In another terminal:

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@example.com","password":"password123"}'
```

Expected response:
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

### 5. Connect Frontend

1. Open another terminal
2. Navigate to frontend: `cd ../ai-med-frontend`
3. Start frontend: `npm run dev`
4. Open http://localhost:3000
5. Login with:
   - Email: `doctor@example.com`
   - Password: `password123`

## Troubleshooting

### Port Already in Use

Change `PORT` in `.env` to a different port (e.g., `3002`)

### Module Not Found

Run `npm install` again

### CORS Errors

Ensure `FRONTEND_URL` in `.env` matches your frontend URL

### WebSocket Not Connecting

See `WEBSOCKET_COMPATIBILITY.md` for WebSocket setup

## What's Next?

- See `NEXT_STEPS.md` for development roadmap
- See `MVP_EXECUTION_PLAN.md` for 12-week plan
- See `README.md` for full documentation
