/**
 * API Test Script
 * Tests the API endpoints with authentication
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

console.log(`${colors.bright}${colors.blue}CO2 Calculation API Test${colors.reset}\n`);

// Check if server is already running
let serverProcess = null;
let serverStarted = false;
let PORT = process.env.PORT || 3000;

// Check if admin token exists
let adminToken = null;
const tokenPath = path.join(__dirname, '..', 'admin-token.txt');

if (fs.existsSync(tokenPath)) {
  try {
    adminToken = fs.readFileSync(tokenPath, 'utf8').trim();
    console.log(`${colors.green}✓ Admin token found${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}✗ Failed to read admin token - ${error.message}${colors.reset}`);
  }
} else {
  console.log(`${colors.yellow}Admin token not found at ${tokenPath}${colors.reset}`);
  console.log(`${colors.yellow}Will attempt to login with default credentials${colors.reset}`);
}

// Test results
const results = {
  health: { success: false, message: '' },
  login: { success: false, message: '', token: null },
  calculate: { success: false, message: '' },
  enhanced: { success: false, message: '' },
  sdg: { success: false, message: '' },
  health_impact: { success: false, message: '' }
};

// Check if server is running
function checkServerRunning() {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      path: '/health',
      method: 'GET',
      timeout: 1000
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`${colors.green}✓ Server is already running on port ${PORT}${colors.reset}`);
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
    
    req.on('error', () => {
      console.log(`${colors.yellow}Server is not running on port ${PORT}${colors.reset}`);
      resolve(false);
    });
    
    req.end();
  });
}

// Start server if not running
function startServer() {
  return new Promise((resolve) => {
    console.log(`${colors.yellow}Starting server for tests...${colors.reset}`);
    
    // Start the server using Node.js
    serverProcess = require('child_process').spawn('node', [path.join(__dirname, '..', 'index.js')], {
      env: { ...process.env, PORT },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let output = '';
    
    serverProcess.stdout.on('data', (data) => {
      output += data.toString();
      if (output.includes('CO2 Calculation API running on port')) {
        console.log(`${colors.green}✓ Server started successfully${colors.reset}`);
        serverStarted = true;
        resolve(true);
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      console.error(`${colors.red}Server error: ${data.toString()}${colors.reset}`);
    });
    
    // Set a timeout in case the server doesn't start properly
    setTimeout(() => {
      if (!serverStarted) {
        console.log(`${colors.yellow}Server may not have started properly, continuing with tests...${colors.reset}`);
        resolve(true);
      }
    }, 5000);
  });
}

// Test health endpoint
function testHealth() {
  return new Promise((resolve) => {
    console.log(`\n${colors.cyan}Testing health endpoint...${colors.reset}`);
    
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: '/health',
      method: 'GET'
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200 && response.meta.success) {
            console.log(`${colors.green}✓ Health endpoint is working${colors.reset}`);
            results.health = { success: true, message: 'Health endpoint is working' };
          } else {
            console.log(`${colors.red}✗ Health endpoint returned unexpected response${colors.reset}`);
            results.health = { success: false, message: `Unexpected response: ${data}` };
          }
        } catch (error) {
          console.error(`${colors.red}✗ Failed to parse health response - ${error.message}${colors.reset}`);
          results.health = { success: false, message: `Failed to parse response: ${error.message}` };
        }
        
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.error(`${colors.red}✗ Health endpoint request failed - ${error.message}${colors.reset}`);
      results.health = { success: false, message: `Request failed: ${error.message}` };
      resolve();
    });
    
    req.end();
  });
}

// Test login
function testLogin() {
  return new Promise((resolve) => {
    if (adminToken) {
      console.log(`${colors.green}✓ Using existing admin token${colors.reset}`);
      results.login = { success: true, message: 'Using existing admin token', token: adminToken };
      resolve();
      return;
    }
    
    console.log(`\n${colors.cyan}Testing login...${colors.reset}`);
    
    const data = JSON.stringify({
      username: 'admin',
      password: 'admin123'
    });
    
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          
          if (res.statusCode === 200 && response.meta.success) {
            console.log(`${colors.green}✓ Login successful${colors.reset}`);
            adminToken = response.data.token;
            results.login = { success: true, message: 'Login successful', token: adminToken };
            
            // Save token to file
            try {
              fs.writeFileSync(tokenPath, adminToken);
              console.log(`${colors.green}✓ Token saved to ${tokenPath}${colors.reset}`);
            } catch (error) {
              console.error(`${colors.red}✗ Failed to save token - ${error.message}${colors.reset}`);
            }
          } else {
            console.log(`${colors.red}✗ Login failed - ${response.error || 'Unknown error'}${colors.reset}`);
            results.login = { success: false, message: `Login failed: ${response.error || 'Unknown error'}` };
          }
        } catch (error) {
          console.error(`${colors.red}✗ Failed to parse login response - ${error.message}${colors.reset}`);
          results.login = { success: false, message: `Failed to parse response: ${error.message}` };
        }
        
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.error(`${colors.red}✗ Login request failed - ${error.message}${colors.reset}`);
      results.login = { success: false, message: `Request failed: ${error.message}` };
      resolve();
    });
    
    req.write(data);
    req.end();
  });
}

// Test calculate endpoint
function testCalculate() {
  return new Promise((resolve) => {
    if (!adminToken) {
      console.log(`${colors.yellow}Skipping calculate test - No token available${colors.reset}`);
      results.calculate = { success: false, message: 'No token available' };
      resolve();
      return;
    }
    
    console.log(`\n${colors.cyan}Testing calculate endpoint...${colors.reset}`);
    
    const data = JSON.stringify({
      roof_area: 2000,
      GWP_roof: 3.0,
      roof_division: {
        "Green Areas": 25,
        "Solar Power": 25,
        "Water Management": 25,
        "Social Impact": 25
      }
    });
    
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: '/calculate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': `Bearer ${adminToken}`
      }
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          
          if (res.statusCode === 200 && response.meta.success) {
            console.log(`${colors.green}✓ Calculate endpoint is working${colors.reset}`);
            results.calculate = { success: true, message: 'Calculate endpoint is working' };
          } else {
            console.log(`${colors.red}✗ Calculate endpoint failed - ${response.error || 'Unknown error'}${colors.reset}`);
            results.calculate = { success: false, message: `Calculate failed: ${response.error || 'Unknown error'}` };
          }
        } catch (error) {
          console.error(`${colors.red}✗ Failed to parse calculate response - ${error.message}${colors.reset}`);
          results.calculate = { success: false, message: `Failed to parse response: ${error.message}` };
        }
        
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.error(`${colors.red}✗ Calculate request failed - ${error.message}${colors.reset}`);
      results.calculate = { success: false, message: `Request failed: ${error.message}` };
      resolve();
    });
    
    req.write(data);
    req.end();
  });
}

// Test enhanced calculate endpoint
function testEnhancedCalculate() {
  return new Promise((resolve) => {
    if (!adminToken) {
      console.log(`${colors.yellow}Skipping enhanced calculate test - No token available${colors.reset}`);
      results.enhanced = { success: false, message: 'No token available' };
      resolve();
      return;
    }
    
    console.log(`\n${colors.cyan}Testing enhanced calculate endpoint...${colors.reset}`);
    
    const data = JSON.stringify({
      roof_area: 2776,
      GWP_roof: 3.33,
      roof_division: {
        "Green Areas": 25,
        "Solar Power": 25,
        "Water Management": 25,
        "Social Impact": 25
      },
      plant_absorption: 1347.976,
      energy_emission: 64095.68,
      solar_emission: 1747.13,
      solar_reduction: 12142.5,
      heating_original: 16720,
      heating_reduced: 12540,
      water_emission: 6849.81,
      water_mitigated: 1441.254,
      water_collected: 427,
      social_metrics: {
        social_network: 11.08,
        trust: 11.08,
        reciprocity: 11.08,
        safety_wellbeing: 9.86,
        social_equity: 9.83,
        happiness: 22.6,
        stress_reduction: 39.4,
        quality_of_life: 35.3
      },
      health_metrics: {
        hypertension_reduction: 6.77,
        heat_wave_temperature: 28,
        mortality_reduction: 15
      }
    });
    
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: '/social/enhanced-calculate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': `Bearer ${adminToken}`
      }
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          
          if (res.statusCode === 200 && response.meta.success) {
            console.log(`${colors.green}✓ Enhanced calculate endpoint is working${colors.reset}`);
            results.enhanced = { success: true, message: 'Enhanced calculate endpoint is working' };
          } else {
            console.log(`${colors.red}✗ Enhanced calculate endpoint failed - ${response.error || 'Unknown error'}${colors.reset}`);
            results.enhanced = { success: false, message: `Enhanced calculate failed: ${response.error || 'Unknown error'}` };
          }
        } catch (error) {
          console.error(`${colors.red}✗ Failed to parse enhanced calculate response - ${error.message}${colors.reset}`);
          results.enhanced = { success: false, message: `Failed to parse response: ${error.message}` };
        }
        
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.error(`${colors.red}✗ Enhanced calculate request failed - ${error.message}${colors.reset}`);
      results.enhanced = { success: false, message: `Request failed: ${error.message}` };
      resolve();
    });
    
    req.write(data);
    req.end();
  });
}

// Test SDG report endpoint
function testSdgReport() {
  return new Promise((resolve) => {
    if (!adminToken) {
      console.log(`${colors.yellow}Skipping SDG report test - No token available${colors.reset}`);
      results.sdg = { success: false, message: 'No token available' };
      resolve();
      return;
    }
    
    console.log(`\n${colors.cyan}Testing SDG report endpoint...${colors.reset}`);
    
    const data = JSON.stringify({
      roof_division: {
        "Green Areas": 25,
        "Solar Power": 25,
        "Water Management": 25,
        "Social Impact": 25
      },
      sdg_focus: [
        "Zero Hunger",
        "Good Health and Well-being",
        "Clean Water and Sanitation",
        "Affordable and Clean Energy"
      ],
      company_name: "Green Building Co.",
      project_name: "Headquarters Roof Renovation"
    });
    
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: '/social/sdg-report',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': `Bearer ${adminToken}`
      }
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          
          if (res.statusCode === 200 && response.meta.success) {
            console.log(`${colors.green}✓ SDG report endpoint is working${colors.reset}`);
            results.sdg = { success: true, message: 'SDG report endpoint is working' };
          } else {
            console.log(`${colors.red}✗ SDG report endpoint failed - ${response.error || 'Unknown error'}${colors.reset}`);
            results.sdg = { success: false, message: `SDG report failed: ${response.error || 'Unknown error'}` };
          }
        } catch (error) {
          console.error(`${colors.red}✗ Failed to parse SDG report response - ${error.message}${colors.reset}`);
          results.sdg = { success: false, message: `Failed to parse response: ${error.message}` };
        }
        
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.error(`${colors.red}✗ SDG report request failed - ${error.message}${colors.reset}`);
      results.sdg = { success: false, message: `Request failed: ${error.message}` };
      resolve();
    });
    
    req.write(data);
    req.end();
  });
}

// Test health impact endpoint
function testHealthImpact() {
  return new Promise((resolve) => {
    if (!adminToken) {
      console.log(`${colors.yellow}Skipping health impact test - No token available${colors.reset}`);
      results.health_impact = { success: false, message: 'No token available' };
      resolve();
      return;
    }
    
    console.log(`\n${colors.cyan}Testing health impact endpoint...${colors.reset}`);
    
    const data = JSON.stringify({
      roof_area: 2776,
      roof_division: {
        "Green Areas": 25,
        "Solar Power": 25,
        "Water Management": 25,
        "Social Impact": 25
      },
      employees: 50,
      building_occupants: 100,
      green_view_percentage: 60
    });
    
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: '/social/health-impact',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': `Bearer ${adminToken}`
      }
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          
          if (res.statusCode === 200 && response.meta.success) {
            console.log(`${colors.green}✓ Health impact endpoint is working${colors.reset}`);
            results.health_impact = { success: true, message: 'Health impact endpoint is working' };
          } else {
            console.log(`${colors.red}✗ Health impact endpoint failed - ${response.error || 'Unknown error'}${colors.reset}`);
            results.health_impact = { success: false, message: `Health impact failed: ${response.error || 'Unknown error'}` };
          }
        } catch (error) {
          console.error(`${colors.red}✗ Failed to parse health impact response - ${error.message}${colors.reset}`);
          results.health_impact = { success: false, message: `Failed to parse response: ${error.message}` };
        }
        
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.error(`${colors.red}✗ Health impact request failed - ${error.message}${colors.reset}`);
      results.health_impact = { success: false, message: `Request failed: ${error.message}` };
      resolve();
    });
    
    req.write(data);
    req.end();
  });
}

// Print test summary
function printSummary() {
  console.log(`\n${colors.bright}${colors.blue}Test Summary${colors.reset}`);
  
  let allSuccess = true;
  
  // Health endpoint
  if (results.health.success) {
    console.log(`${colors.green}✓ Health endpoint: Success${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ Health endpoint: Failed - ${results.health.message}${colors.reset}`);
    allSuccess = false;
  }
  
  // Login
  if (results.login.success) {
    console.log(`${colors.green}✓ Authentication: Success${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ Authentication: Failed - ${results.login.message}${colors.reset}`);
    allSuccess = false;
  }
  
  // Calculate endpoint
  if (results.calculate.success) {
    console.log(`${colors.green}✓ Calculate endpoint: Success${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ Calculate endpoint: Failed - ${results.calculate.message}${colors.reset}`);
    allSuccess = false;
  }
  
  // Enhanced calculate endpoint
  if (results.enhanced.success) {
    console.log(`${colors.green}✓ Enhanced calculate endpoint: Success${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ Enhanced calculate endpoint: Failed - ${results.enhanced.message}${colors.reset}`);
    allSuccess = false;
  }
  
  // SDG report endpoint
  if (results.sdg.success) {
    console.log(`${colors.green}✓ SDG report endpoint: Success${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ SDG report endpoint: Failed - ${results.sdg.message}${colors.reset}`);
    allSuccess = false;
  }
  
  // Health impact endpoint
  if (results.health_impact.success) {
    console.log(`${colors.green}✓ Health impact endpoint: Success${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ Health impact endpoint: Failed - ${results.health_impact.message}${colors.reset}`);
    allSuccess = false;
  }
  
  // Overall result
  console.log(`\n${colors.bright}${allSuccess ? colors.green + 'All tests passed!' : colors.red + 'Some tests failed!'}${colors.reset}`);
  
  if (!allSuccess) {
    console.log(`\n${colors.yellow}Troubleshooting tips:${colors.reset}`);
    console.log(`1. Make sure the API server is running on port ${PORT}`);
    console.log(`2. Check the logs for error messages`);
    console.log(`3. Run 'npm run deploy' to reinitialize the database and server`);
    console.log(`4. Check the README.md for setup instructions`);
  }
  
  // Clean up if we started the server
  if (serverProcess && serverStarted) {
    console.log(`\n${colors.yellow}Stopping test server...${colors.reset}`);
    serverProcess.kill();
  }
  
  // Return exit code based on test results
  process.exit(allSuccess ? 0 : 1);
}

// Run all tests
async function runTests() {
  try {
    // Check if server is running
    const isRunning = await checkServerRunning();
    
    // Start server if not running
    if (!isRunning) {
      await startServer();
    }
    
    // Wait a bit for server to be fully ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Run tests
    await testHealth();
    await testLogin();
    
    if (results.login.success || adminToken) {
      await testCalculate();
      await testEnhancedCalculate();
      await testSdgReport();
      await testHealthImpact();
    } else {
      console.log(`${colors.yellow}Skipping API tests - Authentication failed${colors.reset}`);
    }
    
    printSummary();
  } catch (error) {
    console.error(`${colors.red}Test execution failed: ${error.message}${colors.reset}`);
    
    // Clean up if we started the server
    if (serverProcess && serverStarted) {
      serverProcess.kill();
    }
    
    process.exit(1);
  }
}

// Run tests
runTests();