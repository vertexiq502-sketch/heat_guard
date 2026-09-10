const axios = require('axios');

async function test() {
  try {
    const loginRes = await axios.post('http://localhost:5000/api/v1/auth/verify-demo-otp', {
      phone: '7207015138',
      otp: '1234'
    });
    
    console.log('Login successful');
    const token = loginRes.data.session.access_token;
    
    const dashboardRes = await axios.get('http://localhost:5000/api/v1/dashboard/worker', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Dashboard successful:', dashboardRes.status);
  } catch (error) {
    console.error('Error:', error.response ? error.response.status : error.message);
    if (error.response) console.error(error.response.data);
  }
}

test();
