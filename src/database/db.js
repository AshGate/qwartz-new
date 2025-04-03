import Database from 'better-sqlite3';
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

const db = new Database(dbPath);

// Tables existantes
db.exec(`
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

db.exec(`
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

db.exec(`
  CREATE TABLE IF NOT EXISTS message_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    log_channel_id TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(guild_id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS theme (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#2b2d31',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(guild_id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS recruitment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    is_open BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(guild_id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    tag TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
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

db.exec(`
  CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE
  )
`);

// Nouvelle table pour les logs de tickets
db.exec(`
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

// Insérer un exemple de facture
db.exec(`
  INSERT OR REPLACE INTO invoices (
    id, guild_id, created_by, company_name, address, phone,
    payment_method, blocked_funds, total_ht, total_ttc, currency
  ) VALUES (
    1,
    '1234567890',
    '619551502272561152',
    'Los Tacos',
    '103 Grove Street\nLos Santos',
    '1795',
    'Carte bancaire',
    166.50,
    5383.50,
    5711.51,
    '$'
  )
`);

// Insérer les articles de l'exemple
db.exec(`
  INSERT OR REPLACE INTO invoice_items (invoice_id, name, quantity, unit_price)
  VALUES 
    (1, 'Tacos', 150, 33.95),
    (1, 'Livraison', 150, 1.94)
`);

export default db;