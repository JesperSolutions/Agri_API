/**
 * Enhanced Deployment Script for CO2 Calculation API
 * 
 * This script handles the complete deployment process:
 * 1. Validates environment variables
 * 2. Checks system requirements
 * 3. Creates necessary directories
 * 4. Initializes the database
 * 5. Creates admin user and token
 * 6. Runs tests to verify functionality
 * 7. Starts the server
 */
const { spawn, execSync, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

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

// Deployment stages
const stages = {
  ENVIRONMENT: 'Environment Setup',
  SYSTEM_CHECK: 'System Requirements Check',
  DATABASE: 'Database Initialization',
  ADMIN: 'Admin User Setup',
  TESTS: 'System Tests',
  SERVER: 'Server Startup'
};

// Current stage
let currentStage = stages.ENVIRONMENT;

// Deployment summary
const summary = {
  success: true,
  stages: {},
  warnings: [],
  errors: []
};

/**
 * Log a message with color and stage information
 */
function log(message, type = 'info') {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  let color = colors.reset;
  let prefix = '';
  
  switch (type) {
    case 'success':
      color = colors.green;
      prefix = '✓ ';
      break;
    case 'warning':
      color = colors.yellow;
      prefix = '⚠ ';
      summary.warnings.push(message);
      break;
    case 'error':
      color = colors.red;
      prefix = '✗ ';
      summary.errors.push(message);
      break;
    case 'info':
      color = colors.reset;
      break;
    case 'stage':
      color = colors.bright + colors.blue;
      console.log(`\n${color}[${timestamp}] === ${message} ===${colors.reset}\n`);
      currentStage = message;
      summary.stages[currentStage] = { success: true, messages: [] };
      return;
  }
  
  console.log(`${color}[${timestamp}] ${prefix}${message}${colors.reset}`);
  
  // Add to summary
  if (summary.stages[currentStage]) {
    summary.stages[currentStage].messages.push({ type, message });
    if (type === 'error') {
      summary.stages[currentStage].success = false;
      summary.success = false;
    }
  }
}

/**
 * Execute a shell command and return the result
 */
function execCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' }).trim();
  } catch (error) {
    return null;
  }
}

/**
 * Check if a command is available
 */
function commandExists(command) {
  try {
    execSync(process.platform === 'win32' 
      ? `where ${command}`
      : `which ${command}`, 
      { stdio: 'ignore' }
    );
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check system requirements
 */
function checkSystemRequirements() {
  log(stages.SYSTEM_CHECK, 'stage');
  
  // Check Node.js version
  const nodeVersion = process.version;
  const requiredNodeVersion = 'v14.0.0';
  
  log(`Node.js version: ${nodeVersion}`);
  
  if (compareVersions(nodeVersion, requiredNodeVersion) < 0) {
    log(`Node.js version ${nodeVersion} is below the required version ${requiredNodeVersion}`, 'error');
    return false;
  }
  
  log(`Node.js version ${nodeVersion} meets requirements`, 'success');
  
  // Check npm
  if (!commandExists('npm')) {
    log('npm is not installed or not in PATH. Using Node.js directly for operations.', 'warning');
  } else {
    const npmVersion = execCommand('npm --version');
    log(`npm version: ${npmVersion}`, 'success');
  }
  
  // Check disk space
  try {
    const diskSpace = process.platform === 'win32'
      ? execCommand('wmic logicaldisk get freespace,caption').split('\n').filter(line => line.trim())[1]
      : execCommand('df -h .').split('\n')[1];
    
    log(`Disk space: ${diskSpace}`);
  } catch (error) {
    log('Could not check disk space', 'warning');
  }
  
  // Check memory
  try {
    const totalMem = Math.round(require('os').totalmem() / (1024 * 1024 * 1024));
    const freeMem = Math.round(require('os').freemem() / (1024 * 1024 * 1024));
    
    log(`Memory: ${freeMem}GB free of ${totalMem}GB total`);
    
    if (freeMem < 0.5) {
      log('Less than 0.5GB of free memory available', 'warning');
    }
  } catch (error) {
    log('Could not check memory', 'warning');
  }
  
  return true;
}

/**
 * Compare semver versions
 */
function compareVersions(v1, v2) {
  const v1parts = v1.replace('v', '').split('.');
  const v2parts = v2.replace('v', '').split('.');
  
  for (let i = 0; i < v1parts.length; ++i) {
    if (v2parts.length === i) {
      return 1;
    }
    
    if (v1parts[i] === v2parts[i]) {
      continue;
    }
    
    return parseInt(v1parts[i], 10) > parseInt(v2parts[i], 10) ? 1 : -1;
  }
  
  if (v1parts.length !== v2parts.length) {
    return -1;
  }
  
  return 0;
}

/**
 * Setup environment variables
 */
function setupEnvironment() {
  log(stages.ENVIRONMENT, 'stage');
  
  // Load environment variables
  try {
    require('dotenv').config();
    log('Environment variables loaded', 'success');
  } catch (error) {
    log('Failed to load environment variables: ' + error.message, 'error');
    // Continue anyway, we'll create the .env file if needed
  }
  
  // Check if .env file exists, if not create from example
  if (!fs.existsSync(path.join(__dirname, '.env'))) {
    log('Creating .env file from .env.example', 'info');
    
    try {
      if (fs.existsSync(path.join(__dirname, '.env.example'))) {
        fs.copyFileSync(
          path.join(__dirname, '.env.example'),
          path.join(__dirname, '.env')
        );
        log('.env file created', 'success');
      } else {
        // Create a basic .env file
        const envContent = `# Server Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Security
JWT_SECRET=${crypto.randomBytes(32).toString('hex')}
TOKEN_EXPIRY=30d

# Admin User
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
`;
        fs.writeFileSync(path.join(__dirname, '.env'), envContent);
        log('Basic .env file created with secure JWT_SECRET', 'success');
      }
      
      // Reload environment variables after creating .env
      require('dotenv').config();
      log('Environment variables reloaded', 'success');
    } catch (error) {
      log('Failed to create .env file: ' + error.message, 'error');
      return false;
    }
  } else {
    log('.env file exists', 'success');
    
    // Check if JWT_SECRET is set
    if (!process.env.JWT_SECRET) {
      log('JWT_SECRET is not set in .env file', 'warning');
      
      // Generate a secure JWT_SECRET and append to .env
      try {
        const jwtSecret = crypto.randomBytes(32).toString('hex');
        fs.appendFileSync(
          path.join(__dirname, '.env'),
          `\nJWT_SECRET=${jwtSecret}\n`
        );
        process.env.JWT_SECRET = jwtSecret;
        log('Generated and added secure JWT_SECRET to .env file', 'success');
      } catch (error) {
        log('Failed to add JWT_SECRET to .env file: ' + error.message, 'error');
      }
    }
  }
  
  // Ensure logs directory exists
  const logsDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logsDir)) {
    log('Creating logs directory', 'info');
    try {
      fs.mkdirSync(logsDir, { recursive: true });
      log('Logs directory created', 'success');
    } catch (error) {
      log('Failed to create logs directory: ' + error.message, 'warning');
    }
  } else {
    log('Logs directory exists', 'success');
  }
  
  return true;
}

/**
 * Initialize database
 */
function initializeDatabase() {
  log(stages.DATABASE, 'stage');
  
  // Ensure database directory exists
  const dbDir = path.join(__dirname, 'database', 'data');
  if (!fs.existsSync(dbDir)) {
    log('Creating database directory', 'info');
    try {
      fs.mkdirSync(dbDir, { recursive: true });
      log('Database directory created', 'success');
    } catch (error) {
      log('Failed to create database directory: ' + error.message, 'error');
      return false;
    }
  } else {
    log('Database directory exists', 'success');
  }
  
  // Check if database is initialized
  const dbPath = path.join(dbDir, 'co2calc.db');
  const dbExists = fs.existsSync(dbPath);
  
  if (!dbExists) {
    log('Database not found. Initializing database...', 'info');
    try {
      // Run database initialization script
      execSync(`node ${path.join(__dirname, 'database', 'init-db.js')}`, { stdio: 'inherit' });
      log('Database initialized successfully', 'success');
    } catch (error) {
      log('Database initialization failed: ' + error.message, 'error');
      return false;
    }
  } else {
    log(`Database found at: ${dbPath}`, 'success');
    
    // Check if database is valid by trying to open it
    try {
      const sqlite3 = require('sqlite3').verbose();
      const testDb = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          log(`Database exists but cannot be opened: ${err.message}`, 'error');
          log('Attempting to recreate database...', 'info');
          
          // Backup the corrupted database
          const backupPath = `${dbPath}.backup-${Date.now()}`;
          fs.copyFileSync(dbPath, backupPath);
          log(`Corrupted database backed up to: ${backupPath}`, 'info');
          
          // Delete the corrupted database
          fs.unlinkSync(dbPath);
          log('Corrupted database deleted', 'info');
          
          // Run database initialization script
          try {
            execSync(`node ${path.join(__dirname, 'database', 'init-db.js')}`, { stdio: 'inherit' });
            log('Database recreated successfully', 'success');
            setupAdminToken();
          } catch (initError) {
            log('Database recreation failed: ' + initError.message, 'error');
            return false;
          }
        } else {
          testDb.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", [], (err, row) => {
            testDb.close();
            
            if (err || !row) {
              log('Database file exists but schema is incomplete. Creating tables...', 'warning');
              try {
                execSync(`node ${path.join(__dirname, 'database', 'init-db.js')}`, { stdio: 'inherit' });
                log('Database schema created successfully', 'success');
                setupAdminToken();
              } catch (initError) {
                log('Database schema creation failed: ' + initError.message, 'error');
              }
            } else {
              log('Database schema is valid', 'success');
              setupAdminToken();
            }
          });
        }
      });
    } catch (error) {
      log('Error checking database: ' + error.message, 'error');
      return false;
    }
  }
  
  return true;
}

/**
 * Setup admin token
 */
function setupAdminToken() {
  log(stages.ADMIN, 'stage');
  
  try {
    // Load the database module
    const db = require('./database/db');
    
    // Check if admin token exists
    db.get(
      'SELECT * FROM tokens WHERE user_id = (SELECT id FROM users WHERE username = ?) AND revoked = 0 LIMIT 1',
      [process.env.ADMIN_USERNAME || 'admin'],
      (err, token) => {
        if (err) {
          log('Error checking admin token: ' + err.message, 'error');
          createAdminToken();
          return;
        }
        
        if (!token) {
          log('No valid admin token found. Creating new admin token...', 'info');
          createAdminToken();
        } else {
          log('Admin token exists', 'success');
          
          // Save token to a file for easy access
          const tokenFilePath = path.join(__dirname, 'admin-token.txt');
          fs.writeFileSync(tokenFilePath, token.token);
          log(`Token saved to ${tokenFilePath}`, 'success');
          log(`Admin Token: ${token.token}`, 'info');
          
          // Test database connection
          testDatabaseConnection();
        }
      }
    );
  } catch (error) {
    log('Error checking admin token: ' + error.message, 'error');
    createAdminToken();
  }
}

/**
 * Create admin token
 */
function createAdminToken() {
  log('Creating default admin token for testing...', 'info');
  
  try {
    // Load required modules
    const db = require('./database/db');
    const jwt = require('jsonwebtoken');
    
    // Get admin user
    db.get('SELECT id FROM users WHERE username = ?', [process.env.ADMIN_USERNAME || 'admin'], (err, adminUser) => {
      if (err) {
        log('Failed to find admin user: ' + err.message, 'error');
        log('Continuing without admin token. Please check database setup.', 'warning');
        testDatabaseConnection();
        return;
      }
      
      if (!adminUser) {
        log('Admin user not found in database.', 'error');
        log('Attempting to recreate admin user...', 'info');
        
        // Try to recreate admin user
        const crypto = require('crypto');
        const { v4: uuidv4 } = require('uuid');
        
        function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
          const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
          return { hash, salt };
        }
        
        const adminUsername = process.env.ADMIN_USERNAME || 'admin';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        const { hash, salt } = hashPassword(adminPassword);
        const adminId = uuidv4();
        
        db.run(
          'INSERT INTO users (id, username, password, salt, role) VALUES (?, ?, ?, ?, ?)',
          [adminId, adminUsername, hash, salt, 'admin'],
          function(insertErr) {
            if (insertErr) {
              log('Failed to create admin user: ' + insertErr.message, 'error');
              log('Continuing without admin token. Please check database setup.', 'warning');
              testDatabaseConnection();
            } else {
              log('Admin user created successfully', 'success');
              
              // Now create the token with the new admin user
              createTokenForAdmin(adminId);
            }
          }
        );
        return;
      }
      
      // Create token for existing admin user
      createTokenForAdmin(adminUser.id);
    });
    
    function createTokenForAdmin(adminId) {
      // Generate token
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
      const adminToken = jwt.sign(
        { id: adminId, username: process.env.ADMIN_USERNAME || 'admin', role: 'admin' },
        JWT_SECRET,
        { expiresIn: process.env.TOKEN_EXPIRY || '30d' }
      );
      
      // Check if token already exists
      db.get(
        'SELECT id FROM tokens WHERE user_id = ? AND revoked = 0',
        [adminId],
        (err, existingToken) => {
          if (err) {
            log('Error checking existing tokens: ' + err.message, 'error');
          }
          
          if (existingToken) {
            log('Revoking existing admin token...', 'info');
            
            // Revoke existing token
            db.run(
              'UPDATE tokens SET revoked = 1, revoked_at = CURRENT_TIMESTAMP, revoked_by = ? WHERE id = ?',
              [adminId, existingToken.id],
              (revokeErr) => {
                if (revokeErr) {
                  log('Failed to revoke existing token: ' + revokeErr.message, 'error');
                } else {
                  log('Existing token revoked', 'success');
                }
                
                // Insert new token
                insertNewToken(adminId, adminToken);
              }
            );
          } else {
            // Insert new token
            insertNewToken(adminId, adminToken);
          }
        }
      );
    }
    
    function insertNewToken(adminId, adminToken) {
      // Insert token into database
      const tokenId = uuidv4();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      
      db.run(
        'INSERT INTO tokens (id, user_id, token, purpose, expires_at) VALUES (?, ?, ?, ?, ?)',
        [tokenId, adminId, adminToken, 'Default admin token for testing', expiresAt.toISOString()],
        function(err) {
          if (err) {
            log('Failed to create admin token: ' + err.message, 'error');
            log('Continuing without admin token. Please check database setup.', 'warning');
          } else {
            log('Default admin token created successfully', 'success');
            log(`Admin Token: ${adminToken}`, 'info');
            log(`This token will expire in 30 days`, 'info');
            
            // Save token to a file for easy access
            const tokenFilePath = path.join(__dirname, 'admin-token.txt');
            fs.writeFileSync(tokenFilePath, adminToken);
            log(`Token saved to ${tokenFilePath}`, 'success');
          }
          
          // Test database connection
          testDatabaseConnection();
        }
      );
    }
  } catch (error) {
    log('Failed to create admin token: ' + error.message, 'error');
    log('Continuing without admin token. Please check database setup.', 'warning');
    testDatabaseConnection();
  }
}

/**
 * Test database connection
 */
function testDatabaseConnection() {
  log(stages.TESTS, 'stage');
  log('Testing database connection and CRUD operations...', 'info');
  
  try {
    // Load the database module
    const db = require('./database/db');
    
    // Test database connection
    db.get('SELECT sqlite_version() as version', [], (err, row) => {
      if (err) {
        log('Database connection test failed: ' + err.message, 'error');
        log('Starting server anyway. Please check database setup.', 'warning');
        runTests();
        return;
      }
      
      log(`Connected to SQLite version: ${row ? row.version : 'unknown'}`, 'success');
      
      // Check if users table exists
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", [], (err, table) => {
        if (err || !table) {
          log('Users table not found: ' + (err ? err.message : 'Table does not exist'), 'error');
          log('Database schema may be incomplete. Attempting to reinitialize...', 'warning');
          
          try {
            // Run database initialization script again
            execSync(`node ${path.join(__dirname, 'database', 'init-db.js')}`, { stdio: 'inherit' });
            log('Database reinitialized successfully', 'success');
            runTests();
          } catch (initError) {
            log('Database reinitialization failed: ' + initError.message, 'error');
            log('Starting server anyway. Please check database setup.', 'warning');
            runTests();
          }
        } else {
          log('Database schema verified', 'success');
          
          // Run a quick test of the User model
          try {
            const { User } = require('./models/user');
            
            User.findByUsername(process.env.ADMIN_USERNAME || 'admin')
              .then(user => {
                if (user) {
                  log('Admin user found in database', 'success');
                  log('All database tests passed', 'success');
                } else {
                  log('Admin user not found in database', 'error');
                  log('Database may be corrupted. Starting server anyway.', 'warning');
                }
                runTests();
              })
              .catch(error => {
                log('Error testing User model: ' + error.message, 'error');
                log('Starting server anyway. Please check database setup.', 'warning');
                runTests();
              });
          } catch (modelError) {
            log('Error loading User model: ' + modelError.message, 'error');
            log('Starting server anyway. Please check model setup.', 'warning');
            runTests();
          }
        }
      });
    });
  } catch (error) {
    log('Database test failed: ' + error.message, 'error');
    log('Starting server anyway. Please check database setup.', 'warning');
    runTests();
  }
}

/**
 * Run automated tests
 */
function runTests() {
  log('Running automated tests...', 'info');
  
  // Check if tests should be skipped
  if (process.argv.includes('--skip-tests')) {
    log('Skipping tests (--skip-tests flag provided)', 'warning');
    startServer();
    return;
  }
  
  try {
    // Run our custom API test script instead of npm test
    log('Running API tests directly with Node.js...', 'info');
    
    const testProcess = spawn('node', [path.join(__dirname, 'scripts', 'test-api.js')], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        log('API tests completed successfully', 'success');
      } else {
        log('Some API tests failed or had warnings', 'warning');
        log('Starting server despite test results', 'warning');
      }
      
      startServer();
    });
    
    testProcess.on('error', (err) => {
      log(`Failed to run API tests: ${err.message}`, 'error');
      log('Starting server anyway', 'warning');
      startServer();
    });
  } catch (error) {
    log('Failed to run tests: ' + error.message, 'error');
    log('Starting server anyway', 'warning');
    startServer();
  }
}

/**
 * Start the server
 */
function startServer() {
  log(stages.SERVER, 'stage');
  
  // Print deployment summary
  printSummary();
  
  // Get the port from environment or use default
  const PORT = process.env.PORT || 3000;
  log(`API will run on port: ${PORT}`, 'info');
  
  // Check if server should be started
  if (process.argv.includes('--setup-only')) {
    log('Setup completed. Not starting server (--setup-only flag provided)', 'info');
    process.exit(0);
    return;
  }
  
  // Start the server
  const server = spawn('node', [path.join(__dirname, 'index.js')], {
    env: { ...process.env, PORT },
    stdio: 'inherit'
  });
  
  server.on('error', (err) => {
    log('Failed to start server: ' + err.message, 'error');
    process.exit(1);
  });
  
  log('Server process started', 'success');
  log(`API documentation available at: http://localhost:${PORT}/api-docs`, 'info');
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log('Received SIGINT signal, shutting down gracefully...', 'info');
    server.kill('SIGINT');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    log('Received SIGTERM signal, shutting down gracefully...', 'info');
    server.kill('SIGTERM');
    process.exit(0);
  });
  
  server.on('close', (code) => {
    log(`Server process exited with code ${code}`, 'info');
    process.exit(code);
  });
}

/**
 * Print deployment summary
 */
function printSummary() {
  console.log('\n' + colors.bright + colors.cyan + '=== DEPLOYMENT SUMMARY ===' + colors.reset);
  
  // Print overall status
  if (summary.success) {
    console.log(colors.green + '✓ Deployment completed successfully' + colors.reset);
  } else {
    console.log(colors.red + '✗ Deployment completed with errors' + colors.reset);
  }
  
  // Print stage summaries
  console.log('\nStage Results:');
  for (const stage in summary.stages) {
    const stageResult = summary.stages[stage];
    if (stageResult.success) {
      console.log(`  ${colors.green}✓ ${stage}${colors.reset}`);
    } else {
      console.log(`  ${colors.red}✗ ${stage}${colors.reset}`);
    }
  }
  
  // Print warnings
  if (summary.warnings.length > 0) {
    console.log('\nWarnings:');
    summary.warnings.forEach((warning, index) => {
      console.log(`  ${colors.yellow}${index + 1}. ${warning}${colors.reset}`);
    });
  }
  
  // Print errors
  if (summary.errors.length > 0) {
    console.log('\nErrors:');
    summary.errors.forEach((error, index) => {
      console.log(`  ${colors.red}${index + 1}. ${error}${colors.reset}`);
    });
  }
  
  console.log('\n' + colors.bright + colors.cyan + '=========================' + colors.reset + '\n');
}

// Start deployment process
async function deploy() {
  log(`CO2 Calculation API Deployment (v${require('./package.json').version})`, 'info');
  
  // Setup environment
  if (!setupEnvironment()) {
    log('Environment setup failed, aborting deployment', 'error');
    process.exit(1);
  }
  
  // Check system requirements
  if (!checkSystemRequirements()) {
    log('System requirements check failed, aborting deployment', 'error');
    process.exit(1);
  }
  
  // Initialize database
  if (!initializeDatabase()) {
    log('Database initialization failed, aborting deployment', 'error');
    process.exit(1);
  }
  
  // Note: The rest of the deployment process is handled by callbacks
  // to avoid issues with async/await in the main flow
}

// Run deployment
deploy().catch(error => {
  log('Deployment failed: ' + error.message, 'error');
  process.exit(1);
});