import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '..', 'data', 'orders.db')

export const db = new DatabaseSync(dbPath)
db.exec('PRAGMA journal_mode = WAL')
db.exec('PRAGMA foreign_keys = ON')

// business_id se guarda acá también (denormalizado) aunque el dueño "real" del dato
// sea auth-service — es lo que nos permite filtrar por tenant sin ir a buscar el
// proveedor a catalog-service en cada lectura. provider_id tampoco tiene FK local
// porque providers vive en catalog-service.
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    provider_id INTEGER NOT NULL,
    delivery_date TEXT NOT NULL,
    next_delivery_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    sent_at TEXT
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    product_id INTEGER NOT NULL,
    current_stock_snapshot INTEGER NOT NULL,
    suggested_qty INTEGER NOT NULL,
    final_qty INTEGER NOT NULL,
    purchase_price_snapshot REAL NOT NULL
  );
`)
