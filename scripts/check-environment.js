/**
 * Environment Check Script
 * Checks if the environment is properly set up for the API
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

console.log(`${colors.bright}${colors.blue}CO2 Calculation API Environment Check${colors.reset}\n`);

// Check Node.js version
try {
  const nodeVersion = process.version;
  const requiredNodeVersion = 'v14.0.0';
  
  console.log(`Node.js version: ${nodeVersion}`);
  
  const v1parts = nodeVersion.replace('v', '').split('.');
  const v2parts = requiredNodeVersion.replace('v', '').split('.');
  
  let isValid = true;
  for (let i = 0; i < v1parts.length; ++i) {
    if (v2parts.length === i) {
      break;
    }
    
    if (v1parts[i] === v2parts[i]) {
      continue;
    }
    
    if (parseInt(v1parts[i], 10) < parseInt(v2parts[i], 10)) {
      isValid = false;
      break;
    }
    
    break;
  }
  
  if (isValid) {
    console.log(`${colors.green}✓ Node.js version is compatible${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ Node.js version is below the required version ${requiredNodeVersion}${colors.reset}`);
  }
} catch (error) {
  console.error(`${colors.red}Error checking Node.js version:${colors.reset}`, error);
}

// Check npm
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  console.log(`npm version: ${npmVersion}`);
  console.log(`${colors.green}✓ npm is installed${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}✗ npm is not installed or not in PATH${colors.reset}`);
}

// Check required directories
const requiredDirs = [
  { path: 'database/data', purpose: 'Database storage' },
  { path: 'logs', purpose: 'Log files' }
];

for (const dir of requiredDirs) {
  const dirPath = path.join(__dirname, '..', dir.path);
  
  if (!fs.existsSync(dirPath)) {
    console.log(`${colors.yellow}Directory not found: ${dir.path} (${dir.purpose})${colors.reset}`);
    
    try {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`${colors.green}✓ Created directory: ${dir.path}${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}✗ Failed to create directory: ${dir.path} - ${error.message}${colors.reset}`);
    }
  } else {
    console.log(`${colors.green}✓ Directory exists: ${dir.path}${colors.reset}`);
  }
}

// Check .env file
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.log(`${colors.yellow}.env file not found${colors.reset}`);
  
  // Check if .env.example exists
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  if (fs.existsSync(envExamplePath)) {
    try {
      fs.copyFileSync(envExamplePath, envPath);
      console.log(`${colors.green}✓ Created .env file from .env.example${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}✗ Failed to create .env file - ${error.message}${colors.reset}`);
    }
  } else {
    try {
      // Create basic .env file
      const envContent = `# Server Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Security
JWT_SECRET=${require('crypto').randomBytes(32).toString('hex')}
TOKEN_EXPIRY=30d

# Admin User
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
`;
      fs.writeFileSync(envPath, envContent);
      console.log(`${colors.green}✓ Created basic .env file${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}✗ Failed to create .env file - ${error.message}${colors.reset}`);
    }
  }
} else {
  console.log(`${colors.green}✓ .env file exists${colors.reset}`);
  
  // Check if JWT_SECRET is set
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (!envContent.includes('JWT_SECRET=')) {
      console.log(`${colors.yellow}JWT_SECRET not found in .env file${colors.reset}`);
      
      try {
        const jwtSecret = require('crypto').randomBytes(32).toString('hex');
        fs.appendFileSync(envPath, `\nJWT_SECRET=${jwtSecret}\n`);
        console.log(`${colors.green}✓ Added JWT_SECRET to .env file${colors.reset}`);
      } catch (error) {
        console.error(`${colors.red}✗ Failed to add JWT_SECRET to .env file - ${error.message}${colors.reset}`);
      }
    } else {
      console.log(`${colors.green}✓ JWT_SECRET is set in .env file${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}✗ Failed to read .env file - ${error.message}${colors.reset}`);
  }
}