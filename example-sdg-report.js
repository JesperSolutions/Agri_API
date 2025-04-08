// Example script to test the SDG Report API endpoint with authentication
const http = require('http');

// Replace with your actual token
const API_TOKEN = 'YOUR_API_TOKEN_HERE';

function testSdgReportAPI() {
  const data = JSON.stringify({
    "roof_division": {
      "Green Areas": 25,
      "Solar Power": 25,
      "Water Management": 25,
      "Social Impact": 25
    },
    "sdg_focus": [
      "Zero Hunger",
      "Good Health and Well-being",
      "Clean Water and Sanitation",
      "Affordable and Clean Energy",
      "Decent Work and Economic Growth",
      "Climate Action"
    ],
    "company_name": "Green Building Co.",
    "project_name": "Headquarters Roof Renovation"
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/social/sdg-report',
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
      console.log('SDG Report API Response:');
      console.log(JSON.stringify(JSON.parse(responseData), null, 2));
    });
  });

  req.on('error', (error) => {
    console.error('Error testing SDG Report API:', error);
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
        console.log('\nNow testing SDG Report API with this token...\n');
        
        // Use the token to test the API
        testSdgReportAPIWithToken(response.data.token);
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

function testSdgReportAPIWithToken(token) {
  const data = JSON.stringify({
    "roof_division": {
      "Green Areas": 25,
      "Solar Power": 25,
      "Water Management": 25,
      "Social Impact": 25
    },
    "sdg_focus": [
      "Zero Hunger",
      "Good Health and Well-being",
      "Clean Water and Sanitation",
      "Affordable and Clean Energy",
      "Decent Work and Economic Growth",
      "Climate Action"
    ],
    "company_name": "Green Building Co.",
    "project_name": "Headquarters Roof Renovation"
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/social/sdg-report',
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
      console.log('SDG Report API Response:');
      console.log(JSON.stringify(JSON.parse(responseData), null, 2));
    });
  });

  req.on('error', (error) => {
    console.error('Error testing SDG Report API:', error);
  });

  req.write(data);
  req.end();
}

// If you have a token, uncomment this line
// testSdgReportAPI();

// For testing, login first to get a token
login();