/**
 * Database connection module
 * Provides a singleton database connection
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure database directory exists
const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'co2calc.db');

// Check if database file exists, if not, warn the user
if (!fs.existsSync(dbPath)) {
  console.warn(`Database file not found at ${dbPath}. Run 'npm run init-db' to initialize the database.`);
}

// Create and export database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log(`Connected to SQLite database at: ${dbPath}`);
  }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

module.exports = db;