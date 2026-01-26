/**
 * Comprehensive Integration Test
 * Tests all backend endpoints and WebSocket connection
 */

const http = require('http');
const { io } = require('socket.io-client');

const API_BASE = 'http://localhost:3001';
let authToken = null;

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, message) {
  results.tests.push({ name, passed, message });
  if (passed) {
    results.passed++;
    console.log(`✅ ${name}: ${message}`);
  } else {
    results.failed++;
    console.log(`❌ ${name}: ${message}`);
  }
}

// Test 1: Server Health
function testServerHealth() {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      // Any response means server is running
      logTest('Server Health', true, `Server responding (status: ${res.statusCode})`);
      resolve(true);
    });

    req.on('error', (error) => {
      logTest('Server Health', false, `Server not responding: ${error.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      logTest('Server Health', false, 'Server timeout');
      resolve(false);
    });

    req.end();
  });
}

// Test 2: Login Endpoint
function testLogin() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      email: 'doctor@example.com',
      password: 'password123',
    });

    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: 5000
    }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          try {
            const response = JSON.parse(data);
            if (response.token && response.doctor) {
              authToken = response.token;
              console.log('[TEST] Token received:', authToken.substring(0, 50) + '...');
              logTest('Login Endpoint', true, `Token received, Doctor: ${response.doctor.name}`);
              resolve(true);
            } else {
              logTest('Login Endpoint', false, 'Invalid response format');
              resolve(false);
            }
          } catch (e) {
            logTest('Login Endpoint', false, `JSON parse error: ${e.message}`);
            resolve(false);
          }
        } else {
          logTest('Login Endpoint', false, `Status ${res.statusCode}: ${data}`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      logTest('Login Endpoint', false, `Request error: ${error.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      logTest('Login Endpoint', false, 'Request timeout');
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

// Test 3: Invalid Login
function testInvalidLogin() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      email: 'wrong@example.com',
      password: 'wrongpassword',
    });

    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: 5000
    }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 401) {
          logTest('Invalid Login', true, 'Correctly rejected invalid credentials');
          resolve(true);
        } else {
          logTest('Invalid Login', false, `Expected 401, got ${res.statusCode}`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      logTest('Invalid Login', false, `Request error: ${error.message}`);
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

// Test 4: WebSocket Connection
function testWebSocket() {
  return new Promise((resolve) => {
    if (!authToken) {
      logTest('WebSocket Connection', false, 'No auth token available');
      resolve(false);
      return;
    }

    // Socket.io namespace connection - namespace is /ws/transcription
    const socket = io(`${API_BASE}/ws/transcription`, {
      auth: { token: authToken },
      query: { token: authToken },
      transports: ['websocket', 'polling'],
      timeout: 10000, // Increased timeout
      reconnection: false, // Disable auto-reconnect for test
    });

    let connected = false;
    let errorOccurred = false;

    socket.on('connect', () => {
      connected = true;
      logTest('WebSocket Connection', true, 'Connected successfully');
      socket.disconnect();
      resolve(true);
    });

    socket.on('connect_error', (error) => {
      if (!connected) {
        errorOccurred = true;
        logTest('WebSocket Connection', false, `Connection error: ${error.message}`);
        resolve(false);
      }
    });

    socket.on('error', (error) => {
      if (!connected && !errorOccurred) {
        errorOccurred = true;
        logTest('WebSocket Connection', false, `Error: ${error.message || 'Unknown error'}`);
        resolve(false);
      }
    });

    setTimeout(() => {
      if (!connected && !errorOccurred) {
        socket.disconnect();
        logTest('WebSocket Connection', false, 'Connection timeout');
        resolve(false);
      }
    }, 5000);
  });
}

// Test 5: Protected Endpoint (with token)
function testProtectedEndpoint() {
  return new Promise((resolve) => {
    if (!authToken) {
      logTest('Protected Endpoint', false, 'No auth token available');
      resolve(false);
      return;
    }

    console.log('[TEST] Protected endpoint - using token:', authToken ? authToken.substring(0, 50) + '...' : 'NO TOKEN');
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/alerts',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      timeout: 5000
    }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            if (response.alerts && Array.isArray(response.alerts)) {
              logTest('Protected Endpoint', true, `Retrieved ${response.alerts.length} alerts`);
              resolve(true);
            } else {
              logTest('Protected Endpoint', false, 'Invalid response format');
              resolve(false);
            }
          } catch (e) {
            logTest('Protected Endpoint', false, `JSON parse error: ${e.message}`);
            resolve(false);
          }
        } else if (res.statusCode === 401) {
          console.log('[TEST] 401 Response body:', data);
          logTest('Protected Endpoint', false, `Unauthorized - token invalid (response: ${data})`);
          resolve(false);
        } else {
          logTest('Protected Endpoint', false, `Unexpected status: ${res.statusCode}`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      logTest('Protected Endpoint', false, `Request error: ${error.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      logTest('Protected Endpoint', false, 'Request timeout');
      resolve(false);
    });

    req.end();
  });
}

// Run all tests
async function runAllTests() {
  console.log('🧪 Comprehensive Backend Integration Tests\n');
  console.log('='.repeat(60));

  await testServerHealth();
  await new Promise(resolve => setTimeout(resolve, 500));

  await testLogin();
  await new Promise(resolve => setTimeout(resolve, 500));

  await testInvalidLogin();
  await new Promise(resolve => setTimeout(resolve, 500));

  await testProtectedEndpoint();
  await new Promise(resolve => setTimeout(resolve, 500));

  await testWebSocket();
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Test Results: ${results.passed} passed, ${results.failed} failed`);

  if (results.failed === 0) {
    console.log('✅ ALL TESTS PASSED!');
    process.exit(0);
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('\nFailed tests:');
    results.tests.filter(t => !t.passed).forEach(t => {
      console.log(`  - ${t.name}: ${t.message}`);
    });
    process.exit(1);
  }
}

runAllTests().catch((error) => {
  console.error('Test execution error:', error);
  process.exit(1);
});
