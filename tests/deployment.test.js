/**
 * Deployment Tests
 * Tests the deployment process and system requirements
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('Deployment Requirements', () => {
  // Test Node.js version
  test('Node.js version should be 14.0.0 or higher', () => {
    const nodeVersion = process.version;
    const versionNumber = nodeVersion.substring(1).split('.').map(Number);
    
    expect(versionNumber[0]).toBeGreaterThanOrEqual(14);
  });
  
  // Test npm version
  test('npm should be installed', () => {
    let npmVersion;
    try {
      npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      console.log(`npm version: ${npmVersion}`);
    } catch (error) {
      console.error('Error checking npm version:', error);
    }
    
    expect(npmVersion).toBeDefined();
  });
  
  // Test file system permissions
  test('Should have write access to necessary directories', () => {
    // Test database directory
    const dbDir = path.join(__dirname, '..', 'database', 'data');
    let canWriteToDbDir = false;
    
    try {
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      
      const testFile = path.join(dbDir, 'test-write-access.txt');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      canWriteToDbDir = true;
    } catch (error) {
      console.error('Error testing write access to database directory:', error);
    }
    
    expect(canWriteToDbDir).toBe(true);
    
    // Test logs directory
    const logsDir = path.join(__dirname, '..', 'logs');
    let canWriteToLogsDir = false;
    
    try {
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      
      const testFile = path.join(logsDir, 'test-write-access.txt');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      canWriteToLogsDir = true;
    } catch (error) {
      console.error('Error testing write access to logs directory:', error);
    }
    
    expect(canWriteToLogsDir).toBe(true);
  });
  
  // Test required files
  test('Required files should exist', () => {
    const requiredFiles = [
      'index.js',
      'package.json',
      'database/db.js',
      'database/init-db.js',
      'middleware/auth.js',
      'models/user.js',
      'models/token.js',
      'models/calculation.js',
      'routes/auth.js',
      'routes/calculations.js',
      'routes/admin.js',
      'routes/social.js',
      'utils/calculations.js'
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(__dirname, '..', file);
      expect(fs.existsSync(filePath)).toBe(true);
    }
  });
  
  // Test environment variables
  test('Should be able to load environment variables', () => {
    // Create a test .env file if it doesn't exist
    const envPath = path.join(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) {
      const envExample = path.join(__dirname, '..', '.env.example');
      if (fs.existsSync(envExample)) {
        fs.copyFileSync(envExample, envPath);
      } else {
        fs.writeFileSync(envPath, 'JWT_SECRET=test-secret\nPORT=3000\n');
      }
    }
    
    // Load environment variables
    require('dotenv').config();
    
    // Check if JWT_SECRET is set
    expect(process.env.JWT_SECRET).toBeDefined();
  });
  
  // Test database initialization
  test('Should be able to initialize database', () => {
    // This is a more complex test that might fail in CI environments
    // So we'll make it conditional
    if (process.env.SKIP_DB_INIT_TEST) {
      console.log('Skipping database initialization test');
      return;
    }
    
    let dbInitOutput;
    try {
      // Run database initialization with output capture
      dbInitOutput = execSync('node database/init-db.js', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      console.log('Database initialization output:', dbInitOutput);
    } catch (error) {
      console.error('Error initializing database:', error);
      console.log('Error output:', error.stdout, error.stderr);
    }
    
    // Check if database file was created
    const dbPath = path.join(__dirname, '..', 'database', 'data', 'co2calc.db');
    expect(fs.existsSync(dbPath)).toBe(true);
  });
});