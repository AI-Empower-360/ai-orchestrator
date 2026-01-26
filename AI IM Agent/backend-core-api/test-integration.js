/**
 * Simple integration test script
 * Tests backend API endpoints
 */

const http = require('http');

const API_BASE = 'http://localhost:3001';

// Test login endpoint
function testLogin() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: 'doctor@example.com',
      password: 'password123',
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          const response = JSON.parse(data);
          if (response.token && response.doctor) {
            console.log('✅ Login test PASSED');
            console.log('   Token received:', response.token.substring(0, 20) + '...');
            console.log('   Doctor:', response.doctor.name);
            resolve(response.token);
          } else {
            console.log('❌ Login test FAILED - Invalid response format');
            reject(new Error('Invalid response'));
          }
        } else {
          console.log('❌ Login test FAILED - Status:', res.statusCode);
          console.log('   Response:', data);
          reject(new Error(`Status ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Login test FAILED - Connection error');
      console.log('   Error:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Test health/status
function testHealth() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/',
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      if (res.statusCode === 404 || res.statusCode === 200) {
        console.log('✅ Server is running (status:', res.statusCode + ')');
        resolve();
      } else {
        console.log('⚠️  Unexpected status:', res.statusCode);
        resolve();
      }
    });

    req.on('error', (error) => {
      console.log('❌ Server connection FAILED');
      console.log('   Error:', error.message);
      console.log('   Make sure backend is running: npm run start:dev');
      reject(error);
    });

    req.end();
  });
}

// Run tests
async function runTests() {
  console.log('🧪 Testing Backend Integration\n');
  console.log('='.repeat(50));

  try {
    console.log('\n1. Testing server connection...');
    await testHealth();

    console.log('\n2. Testing login endpoint...');
    const token = await testLogin();

    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests PASSED!');
    console.log('\nNext steps:');
    console.log('1. Start frontend: cd ../ai-med-frontend && npm run dev');
    console.log('2. Open http://localhost:3000');
    console.log('3. Login with: doctor@example.com / password123');
  } catch (error) {
    console.log('\n' + '='.repeat(50));
    console.log('❌ Tests FAILED');
    console.log('\nTroubleshooting:');
    console.log('1. Make sure backend is running: npm run start:dev');
    console.log('2. Check port 3001 is available');
    console.log('3. Verify .env file exists with correct settings');
    process.exit(1);
  }
}

runTests();
