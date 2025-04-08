// Example script to test the Enhanced Calculation API endpoint with authentication
const http = require('http');

// Replace with your actual token
const API_TOKEN = 'YOUR_API_TOKEN_HERE';

function testEnhancedAPI() {
  const data = JSON.stringify({
    "roof_area": 2776,
    "GWP_roof": 3.33,
    "roof_division": {
      "Green Areas": 25,
      "Solar Power": 25,
      "Water Management": 25,
      "Social Impact": 25
    },
    "plant_absorption": 1347.976,
    "energy_emission": 64095.68,
    "solar_emission": 1747.13,
    "solar_reduction": 12142.5,
    "heating_original": 16720,
    "heating_reduced": 12540,
    "water_emission": 6849.81,
    "water_mitigated": 1441.254,
    "water_collected": 427,
    "social_metrics": {
      "social_network": 11.08,
      "trust": 11.08,
      "reciprocity": 11.08,
      "safety_wellbeing": 9.86,
      "social_equity": 9.83,
      "happiness": 22.6,
      "stress_reduction": 39.4,
      "quality_of_life": 35.3
    },
    "health_metrics": {
      "hypertension_reduction": 6.77,
      "heat_wave_temperature": 28,
      "mortality_reduction": 15
    },
    "sdg_focus": [
      "Zero Hunger",
      "Good Health and Well-being",
      "Clean Water and Sanitation",
      "Affordable and Clean Energy",
      "Decent Work and Economic Growth",
      "Climate Action",
      "Life on Land",
      "Partnerships for the Goals"
    ]
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/social/enhanced-calculate',
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
      console.log('Enhanced API Response:');
      console.log(JSON.stringify(JSON.parse(responseData), null, 2));
    });
  });

  req.on('error', (error) => {
    console.error('Error testing Enhanced API:', error);
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
        console.log('\nNow testing Enhanced API with this token...\n');
        
        // Use the token to test the API
        testEnhancedAPIWithToken(response.data.token);
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

function testEnhancedAPIWithToken(token) {
  const data = JSON.stringify({
    "roof_area": 2776,
    "GWP_roof": 3.33,
    "roof_division": {
      "Green Areas": 25,
      "Solar Power": 25,
      "Water Management": 25,
      "Social Impact": 25
    },
    "plant_absorption": 1347.976,
    "energy_emission": 64095.68,
    "solar_emission": 1747.13,
    "solar_reduction": 12142.5,
    "heating_original": 16720,
    "heating_reduced": 12540,
    "water_emission": 6849.81,
    "water_mitigated": 1441.254,
    "water_collected": 427,
    "social_metrics": {
      "social_network": 11.08,
      "trust": 11.08,
      "reciprocity": 11.08,
      "safety_wellbeing": 9.86,
      "social_equity": 9.83,
      "happiness": 22.6,
      "stress_reduction": 39.4,
      "quality_of_life": 35.3
    },
    "health_metrics": {
      "hypertension_reduction": 6.77,
      "heat_wave_temperature": 28,
      "mortality_reduction": 15
    },
    "sdg_focus": [
      "Zero Hunger",
      "Good Health and Well-being",
      "Clean Water and Sanitation",
      "Affordable and Clean Energy"
    ]
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/social/enhanced-calculate',
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
      console.log('Enhanced API Response:');
      console.log(JSON.stringify(JSON.parse(responseData), null, 2));
    });
  });

  req.on('error', (error) => {
    console.error('Error testing Enhanced API:', error);
  });

  req.write(data);
  req.end();
}

// If you have a token, uncomment this line
// testEnhancedAPI();

// For testing, login first to get a token
login();