# Frontend-Backend Integration Testing Guide

## ✅ Setup Complete

Both repositories are now configured and ready for testing:

- ✅ Backend: NestJS with Socket.io WebSocket
- ✅ Frontend: Next.js with Socket.io-client
- ✅ WebSocket compatibility: Fixed
- ✅ Dependencies: Installed

## 🚀 Quick Test Steps

### 1. Start Backend Server

```bash
cd ai-med-backend
npm run start:dev
```

You should see:
```
🚀 Backend server running on http://localhost:3001
```

### 2. Test Backend API (Optional)

In another terminal, run the test script:

```bash
cd ai-med-backend
node test-integration.js
```

Or manually test login:
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"doctor@example.com\",\"password\":\"password123\"}"
```

### 3. Start Frontend Server

In a new terminal:

```bash
cd ai-med-frontend
npm run dev
```

You should see:
```
- ready started server on 0.0.0.0:3000
- Local: http://localhost:3000
```

### 4. Test in Browser

1. Open http://localhost:3000
2. You should be redirected to `/login`
3. Login with:
   - **Email:** `doctor@example.com`
   - **Password:** `password123`
4. After login, you should see the dashboard
5. Click "Start Recording" to test WebSocket connection
6. You should see mock transcription events appearing

## 🧪 What to Test

### Authentication Flow
- [ ] Login page loads
- [ ] Login with valid credentials works
- [ ] Invalid credentials show error
- [ ] Redirects to dashboard after login
- [ ] Logout clears session

### Dashboard
- [ ] Dashboard loads after login
- [ ] Doctor name displays in header
- [ ] All panels are visible (Transcription, SOAP Notes, Alerts)

### Recording & WebSocket
- [ ] "Start Recording" button works
- [ ] WebSocket connects (check browser console)
- [ ] Mock transcription events appear
- [ ] SOAP notes update automatically
- [ ] Alerts appear
- [ ] "Stop Recording" works

### SOAP Notes
- [ ] Notes panel displays
- [ ] Can edit notes manually
- [ ] Save button works
- [ ] Notes persist (in memory for now)

### Alerts
- [ ] Alerts panel displays
- [ ] Alerts show with correct severity
- [ ] Acknowledge button works
- [ ] New alerts appear via WebSocket

## 🔍 Debugging

### Backend Not Starting

**Check:**
- Port 3001 is available
- `.env` file exists with correct settings
- Dependencies installed: `npm install`

**Common Issues:**
- Port already in use: Change `PORT` in `.env`
- Module not found: Run `npm install`

### Frontend Not Starting

**Check:**
- Port 3000 is available
- `.env.local` file exists
- Dependencies installed: `npm install`

**Common Issues:**
- Port already in use: Next.js will use next available port
- Build errors: Try `npm run dev` (development mode)

### WebSocket Not Connecting

**Check Browser Console:**
- Look for connection errors
- Verify JWT token is valid
- Check CORS settings

**Common Issues:**
- Backend not running
- Wrong WebSocket URL
- CORS blocking connection
- JWT token expired

### Login Fails

**Check:**
- Backend is running
- Email/password correct: `doctor@example.com` / `password123`
- Network tab shows 200 response

## 📊 Expected Behavior

### Mock Transcription Flow

When you start recording:
1. WebSocket connects
2. Every 2 seconds, you'll see:
   - Partial transcription events
   - Every 3rd event is final
3. After ~14 seconds, SOAP notes update automatically
4. Alert appears about new SOAP notes

### Mock Data

**Doctors:**
- Email: `doctor@example.com`
- Password: `password123`
- Name: `Dr. John Smith`

**Alerts:**
- System initialized (info)
- High patient volume (warning)

## 🐛 Known Issues

1. **PostCSS Build Error (Windows)**
   - Issue: Build fails on Windows
   - Workaround: Use `npm run dev` (development mode works fine)

2. **WebSocket Reconnection**
   - Auto-reconnect is handled by Socket.io
   - May take a few seconds

3. **Mock Transcription Timing**
   - Transcription events are simulated
   - Timing is fixed (not based on real audio)

## ✅ Success Criteria

Integration is working if:
- ✅ Login succeeds
- ✅ Dashboard loads
- ✅ WebSocket connects (check Network tab)
- ✅ Transcription events appear
- ✅ SOAP notes update
- ✅ Alerts display

## 📝 Next Steps After Testing

Once basic integration works:

1. **Database Integration** - Replace mock storage
2. **Real Transcription** - Integrate AWS Transcribe
3. **AI SOAP Generation** - Connect LLM service
4. **Production Hardening** - Add monitoring, logging

See `CURSOR_PROMPTS.md` for exact prompts to implement these.

## 🆘 Need Help?

- Backend issues: Check `README.md` in `ai-med-backend`
- Frontend issues: Check `README.md` in `ai-med-frontend`
- WebSocket issues: Check `WEBSOCKET_COMPATIBILITY.md`
- API contracts: Check `API_CONTRACTS.md`
