// Using native fetch API available in Node.js 18+

const API_BASE = 'http://localhost:3002/api/v1';

async function testAuthentication() {
  try {
    console.log('🔐 Testing authentication...\n');

    // Test login
    console.log('1. Testing login with admin credentials...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@griffe.com',
        password: 'admin123456'
      })
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.text();
      console.log('❌ Login failed:', error);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful!');
    console.log('📋 Full Response:', loginData);
    console.log('📋 Response Summary:', {
      success: loginData.success,
      hasData: !!loginData.data,
      dataKeys: loginData.data ? Object.keys(loginData.data) : [],
      tokenType: typeof loginData.data?.token,
      hasUser: !!loginData.data?.user
    });

    // Test protected route
    console.log('\n2. Testing protected route with token...');
    const token = loginData.data?.token;
    if (!token) {
      console.log('❌ No token found in response');
      return;
    }
    
    const meResponse = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!meResponse.ok) {
      const error = await meResponse.text();
      console.log('❌ Protected route failed:', error);
      return;
    }

    const meData = await meResponse.json();
    console.log('✅ Protected route successful!');
    console.log('👤 User data:', meData);

    // Test API health
    console.log('\n3. Testing API health...');
    const healthResponse = await fetch('http://localhost:3002/');
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ API health check successful!');
      console.log('🏥 Health status:', healthData);
    } else {
      console.log('⚠️ Health endpoint not available');
    }

    console.log('\n🎉 All authentication tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuthentication();