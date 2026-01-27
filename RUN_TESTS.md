# Run Comprehensive Tests

## Steps to Run Tests

1. **Start Backend Server** (Terminal 1):
   ```bash
   cd C:\Users\ctrpr\Projects\ai-med-backend
   npm run start:dev
   ```
   Wait for: `🚀 Backend server running on http://localhost:3001`

2. **Run Comprehensive Tests** (Terminal 2):
   ```bash
   cd C:\Users\ctrpr\Projects\ai-med-backend
   node test-comprehensive.js
   ```

3. **Expected Output:**
   - ✅ Server Health: Server responding
   - ✅ Login Endpoint: Token received
   - ✅ Invalid Login: Correctly rejected
   - ✅ Protected Endpoint: Retrieved alerts
   - ✅ WebSocket Connection: Connected successfully

4. **If any tests fail**, the script will show which ones failed.

## What the Tests Check

1. **Server Health** - Verifies backend is running
2. **Login Endpoint** - Tests valid credentials
3. **Invalid Login** - Tests rejection of bad credentials
4. **Protected Endpoint** - Tests JWT authentication
5. **WebSocket Connection** - Tests Socket.io connection with JWT

All tests must pass for 100% success rate.
