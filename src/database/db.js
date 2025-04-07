import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '../../data/directory.db');

const dataDir = join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db;

async function initializeDatabase() {
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Tables existantes
  await db.exec(`
    CREATE TABLE IF NOT EXISTS directory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      numero TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(guild_id, numero)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS whitelist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      added_by TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP,
      UNIQUE(guild_id, user_id)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS message_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      log_channel_id TEXT NOT NULL,
      enabled BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(guild_id)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS theme (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#2b2d31',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(guild_id)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS recruitment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      is_open BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(guild_id)
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      tag TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      created_by TEXT NOT NULL,
      company_name TEXT NOT NULL,
      address TEXT NOT NULL,
      phone TEXT,
      payment_method TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      blocked_funds REAL DEFAULT 0,
      comments TEXT,
      total_ht REAL NOT NULL,
      total_ttc REAL NOT NULL,
      logo_url TEXT,
      currency TEXT NOT NULL DEFAULT '$'
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS ticket_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      ticket_id TEXT NOT NULL,
      ticket_number INTEGER NOT NULL,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      details TEXT
    )
  `);
}

// Initialise la base de données
await initializeDatabase();

// Wrapper pour les méthodes de la base de données
const dbWrapper = {
  prepare: (sql) => ({
    run: async (...params) => {
      const stmt = await db.prepare(sql);
      return await stmt.run(...params);
    },
    get: async (...params) => {
      const stmt = await db.prepare(sql);
      return await stmt.get(...params);
    },
    all: async (...params) => {
      const stmt = await db.prepare(sql);
      return await stmt.all(...params);
    }
  }),
  exec: async (sql) => await db.exec(sql)
};

export default dbWrapper;