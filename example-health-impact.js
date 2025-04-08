// Example script to test the Health Impact API endpoint with authentication
const http = require('http');

// Replace with your actual token
const API_TOKEN = 'YOUR_API_TOKEN_HERE';

function testHealthImpactAPI() {
  const data = JSON.stringify({
    "roof_area": 2776,
    "roof_division": {
      "Green Areas": 25,
      "Solar Power": 25,
      "Water Management": 25,
      "Social Impact": 25
    },
    "employees": 50,
    "building_occupants": 100,
    "green_view_percentage": 60
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/social/health-impact',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      'Authorization': `Bearer ${API_TOKEN}`
    }
  };

  const req = http.request(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      console.log('Health Impact API Response:');
      console.log(JSON.stringify(JSON.parse(responseData), null, 2));
    });
  });

  req.on('error', (error) => {
    console.error('Error testing Health Impact API:', error);
  });

  req.write(data);
  req.end();
}

// First login to get a token (for testing purposes)
function login() {
  const loginData = JSON.stringify({
    "username": "admin",
    "password": "admin123"
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': loginData.length
    }
  };

  const req = http.request(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      const response = JSON.parse(responseData);
      if (response.meta.success) {
        console.log('Login successful, received token:');
        console.log(response.data.token);
        console.log('\nNow testing Health Impact API with this token...\n');
        
        // Use the token to test the API
        testHealthImpactAPIWithToken(response.data.token);
      } else {
        console.error('Login failed:', response.error);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Error logging in:', error);
  });

  req.write(loginData);
  req.end();
}

function testHealthImpactAPIWithToken(token) {
  const data = JSON.stringify({
    "roof_area": 2776,
    "roof_division": {
      "Green Areas": 25,
      "Solar Power": 25,
      "Water Management": 25,
      "Social Impact": 25
    },
    "employees": 50,
    "building_occupants": 100,
    "green_view_percentage": 60
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/social/health-impact',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      'Authorization': `Bearer ${token}`
    }
  };

  const req = http.request(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      console.log('Health Impact API Response:');
      console.log(JSON.stringify(JSON.parse(responseData), null, 2));
    });
  });

  req.on('error', (error) => {
    console.error('Error testing Health Impact API:', error);
  });

  req.write(data);
  req.end();
}

// If you have a token, uncomment this line
// testHealthImpactAPI();

// For testing, login first to get a token
login();