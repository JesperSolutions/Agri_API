/**
 * Database initialization script
 * Creates SQLite database and tables if they don't exist
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const algorithm = 'aes-256-gcm';
const dbEncryptionKey = process.env.DB_ENCRYPTION_KEY || crypto.randomBytes(32);
const dbEncryptionIV = crypto.randomBytes(16);

// Function to encrypt database values
function encryptData(text) {
  const cipher = crypto.createCipheriv(algorithm, dbEncryptionKey, dbEncryptionIV);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return {
    encrypted,
    tag: tag.toString('hex'),
    iv: dbEncryptionIV.toString('hex')
  };
}

// Function to decrypt database values
function decryptData(encrypted, tag, iv) {
  const decipher = crypto.createDecipheriv(algorithm, dbEncryptionKey, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

console.log(`${colors.bright}${colors.blue}Initializing database...${colors.reset}`);

// Ensure database directory exists
const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  console.log(`${colors.yellow}Creating database directory...${colors.reset}`);
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(`${colors.green}✓ Database directory created${colors.reset}`);
}

const dbPath = path.join(dbDir, 'co2calc.db');
console.log(`${colors.yellow}Database path: ${dbPath}${colors.reset}`);

// Check if database file already exists
const dbExists = fs.existsSync(dbPath);
if (dbExists) {
  console.log(`${colors.yellow}Database file already exists. Checking if it's valid...${colors.reset}`);
  
  try {
    // Try to open the database to check if it's valid
    const testDb = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        console.error(`${colors.red}Database file exists but cannot be opened:${colors.reset}`, err);
        console.log(`${colors.yellow}Creating a new database file...${colors.reset}`);
        
        // Backup the corrupted database
        const backupPath = `${dbPath}.backup-${Date.now()}`;
        fs.copyFileSync(dbPath, backupPath);
        console.log(`${colors.yellow}Corrupted database backed up to:${colors.reset} ${backupPath}`);
        
        // Delete the corrupted database
        fs.unlinkSync(dbPath);
        console.log(`${colors.yellow}Corrupted database deleted${colors.reset}`);
        
        // Create a new database
        createDatabase();
      } else {
        testDb.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", [], (err, row) => {
          testDb.close();
          
          if (err || !row) {
            console.log(`${colors.yellow}Database file exists but schema is incomplete. Creating tables...${colors.reset}`);
            createDatabase();
          } else {
            console.log(`${colors.green}✓ Database file is valid. Skipping initialization.${colors.reset}`);
            process.exit(0);
          }
        });
      }
    });
  } catch (error) {
    console.error(`${colors.red}Error checking database:${colors.reset}`, error);
    console.log(`${colors.yellow}Creating a new database file...${colors.reset}`);
    
    // Backup the corrupted database
    const backupPath = `${dbPath}.backup-${Date.now()}`;
    fs.copyFileSync(dbPath, backupPath);
    console.log(`${colors.yellow}Corrupted database backed up to:${colors.reset} ${backupPath}`);
    
    // Delete the corrupted database
    fs.unlinkSync(dbPath);
    console.log(`${colors.yellow}Corrupted database deleted${colors.reset}`);
    
    // Create a new database
    createDatabase();
  }
} else {
  console.log(`${colors.yellow}Database file does not exist. Creating new database...${colors.reset}`);
  createDatabase();
}

function createDatabase() {
  // Helper function to hash passwords
  function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return { hash, salt };
  }

  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error(`${colors.red}Error creating database:${colors.reset}`, err);
      process.exit(1);
    }
    console.log(`${colors.green}✓ Connected to SQLite database${colors.reset}`);
  });

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  // Create tables
  db.serialize(() => {
    console.log(`${colors.yellow}Creating database tables...${colors.reset}`);

    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        salt TEXT NOT NULL,
        role TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by TEXT
      )
    `, (err) => {
      if (err) {
        console.error(`${colors.red}Error creating users table:${colors.reset}`, err);
      } else {
        console.log(`${colors.green}✓ Users table created${colors.reset}`);
      }
    });

    // Tokens table
    db.run(`
      CREATE TABLE IF NOT EXISTS tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        request_id TEXT,
        token TEXT UNIQUE NOT NULL,
        company TEXT,
        email TEXT,
        purpose TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        revoked INTEGER DEFAULT 0,
        revoked_at DATETIME,
        revoked_by TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `, (err) => {
      if (err) {
        console.error(`${colors.red}Error creating tokens table:${colors.reset}`, err);
      } else {
        console.log(`${colors.green}✓ Tokens table created${colors.reset}`);
      }
    });

    // Token requests table
    db.run(`
      CREATE TABLE IF NOT EXISTS token_requests (
        id TEXT PRIMARY KEY,
        company TEXT NOT NULL,
        email TEXT NOT NULL,
        purpose TEXT NOT NULL,
        company_id TEXT,
        address TEXT,
        status TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        approved_at DATETIME,
        approved_by TEXT,
        FOREIGN KEY (approved_by) REFERENCES users (id)
      )
    `, (err) => {
      if (err) {
        console.error(`${colors.red}Error creating token_requests table:${colors.reset}`, err);
      } else {
        console.log(`${colors.green}✓ Token requests table created${colors.reset}`);
      }
    });

    // Calculations table
    db.run(`
      CREATE TABLE IF NOT EXISTS calculations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        parameters TEXT NOT NULL,
        results TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `, (err) => {
      if (err) {
        console.error(`${colors.red}Error creating calculations table:${colors.reset}`, err);
      } else {
        console.log(`${colors.green}✓ Calculations table created${colors.reset}`);
      }
    });

    // Check if default admin user exists
    db.get('SELECT * FROM users WHERE username = ?', [process.env.ADMIN_USERNAME || 'admin'], (err, row) => {
      if (err) {
        console.error(`${colors.red}Error checking for admin user:${colors.reset}`, err);
        db.close();
        return;
      }

      // Create default admin user if not exists
      if (!row) {
        const adminUsername = process.env.ADMIN_USERNAME || 'admin';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        const { hash, salt } = hashPassword(adminPassword);
        const adminId = uuidv4();

        db.run(
          'INSERT INTO users (id, username, password, salt, role) VALUES (?, ?, ?, ?, ?)',
          [adminId, adminUsername, hash, salt, 'admin'],
          (err) => {
            if (err) {
              console.error(`${colors.red}Error creating admin user:${colors.reset}`, err);
            } else {
              console.log(`${colors.green}✓ Default admin user created: ${adminUsername}${colors.reset}`);
              console.log(`${colors.yellow}Admin password: ${adminPassword}${colors.reset}`);
            }
            
            db.close((err) => {
              if (err) {
                console.error(`${colors.red}Error closing database:${colors.reset}`, err);
              } else {
                console.log(`${colors.green}✓ Database initialized successfully${colors.reset}`);
              }
            });
          }
        );
      } else {
        console.log(`${colors.green}✓ Admin user already exists${colors.reset}`);
        
        db.close((err) => {
          if (err) {
            console.error(`${colors.red}Error closing database:${colors.reset}`, err);
          } else {
            console.log(`${colors.green}✓ Database initialized successfully${colors.reset}`);
          }
        });
      }
    });
  });
}