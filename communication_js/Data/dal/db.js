const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', '..', 'school.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS host (
    dong TEXT PRIMARY KEY,
    systemmode INTEGER DEFAULT 0,
    has_meter_110 INTEGER DEFAULT 1,
    has_meter_220 INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS room (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    center_id INTEGER,
    meter_id INTEGER,
    dong TEXT,
    floor INTEGER DEFAULT 1,
    mode INTEGER DEFAULT 0,
    price_degree REAL DEFAULT 0,
    mode_220 INTEGER DEFAULT 0,
    price_degree_220 REAL DEFAULT 0,
    amount REAL DEFAULT 0,
    amount_220 REAL DEFAULT 0,
    enable INTEGER DEFAULT 1,
    system_mode INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS member (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    id_card TEXT,
    room_strings TEXT,
    balance REAL DEFAULT 0,
    start_balance REAL DEFAULT 0,
    now_balance REAL DEFAULT 0,
    powerstatus INTEGER DEFAULT 0,
    identity INTEGER DEFAULT 0,
    can_control_power INTEGER DEFAULT 1,
    can_open_door INTEGER DEFAULT 1,
    start_amount_110 REAL DEFAULT 0,
    now_amount_110 REAL DEFAULT 0,
    start_amount_220 REAL DEFAULT 0,
    now_amount_220 REAL DEFAULT 0,
    start_date TEXT
  );

  CREATE TABLE IF NOT EXISTS center_id_card (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_card TEXT UNIQUE
  );
`);

// Migration: add system_mode to existing databases
try { db.exec('ALTER TABLE room ADD COLUMN system_mode INTEGER DEFAULT 0'); } catch {}

module.exports = db;
