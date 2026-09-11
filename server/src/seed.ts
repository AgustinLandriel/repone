import { db } from './db.js'
import { hashPassword } from './lib/password.js'

type SeedProduct = {
  name: string
  barcode: string
  purchase: number
  sale: number
  currentStock: number
  reorderPoint: number
}

const DEMO_BUSINESS_NAME = 'Comercio Demo'
const DEMO_INVITE_CODE = 'DEMO0001'
const DEMO_EMAIL = 'demo@repone.test'
const DEMO_PASSWORD = 'demo1234'

const SEED: Record<string, SeedProduct[]> = {
  'Distribuidora Sur': [
    { name: 'Coca-Cola 500ml', barcode: '7790895000012', purchase: 450, sale: 700, currentStock: 8, reorderPoint: 32 },
    { name: 'Sprite 500ml', barcode: '7790895000029', purchase: 430, sale: 680, currentStock: 3, reorderPoint: 21 },
    { name: 'Agua Mineral 1.5L', barcode: '7790895000036', purchase: 300, sale: 500, currentStock: 15, reorderPoint: 25 },
  ],
  'Bebidas Andina': [
    { name: 'Jugo Naranja 1L', barcode: '7790895000043', purchase: 900, sale: 1400, currentStock: 0, reorderPoint: 12 },
    { name: 'Cerveza Lager 1L', barcode: '7790895000050', purchase: 650, sale: 1000, currentStock: 6, reorderPoint: 26 },
    { name: 'Vino Tinto 750ml', barcode: '7790895000067', purchase: 1200, sale: 2000, currentStock: 4, reorderPoint: 12 },
  ],
  'Almacén Norte': [
    { name: 'Fideos 500g', barcode: '7790895000074', purchase: 380, sale: 600, currentStock: 10, reorderPoint: 25 },
    { name: 'Arroz 1kg', barcode: '7790895000081', purchase: 420, sale: 650, currentStock: 2, reorderPoint: 22 },
  ],
}

const insertBusiness = db.prepare('INSERT OR IGNORE INTO businesses (name, invite_code) VALUES (?, ?)')
const getBusinessId = db.prepare('SELECT id FROM businesses WHERE invite_code = ?')
const insertUser = db.prepare('INSERT OR IGNORE INTO users (business_id, email, password_hash, role) VALUES (?, ?, ?, ?)')
const insertProvider = db.prepare('INSERT OR IGNORE INTO providers (business_id, name) VALUES (?, ?)')
const getProviderId = db.prepare('SELECT id FROM providers WHERE business_id = ? AND name = ?')
const insertProduct = db.prepare(`
  INSERT OR IGNORE INTO products
    (business_id, name, barcode, provider_id, purchase_price, sale_price, current_stock, reorder_point, last_stock_at)
  VALUES (@businessId, @name, @barcode, @providerId, @purchase, @sale, @currentStock, @reorderPoint, datetime('now'))
`)

function seed() {
  db.exec('BEGIN')
  try {
    insertBusiness.run(DEMO_BUSINESS_NAME, DEMO_INVITE_CODE)
    const businessId = (getBusinessId.get(DEMO_INVITE_CODE) as { id: number }).id

    insertUser.run(businessId, DEMO_EMAIL, hashPassword(DEMO_PASSWORD), 'owner')

    for (const [providerName, products] of Object.entries(SEED)) {
      insertProvider.run(businessId, providerName)
      const providerId = (getProviderId.get(businessId, providerName) as { id: number }).id

      for (const p of products) {
        insertProduct.run({
          businessId,
          name: p.name,
          barcode: p.barcode,
          providerId,
          purchase: p.purchase,
          sale: p.sale,
          currentStock: p.currentStock,
          reorderPoint: p.reorderPoint,
        })
      }
    }
    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
}

seed()
console.log(`Seed completo. Comercio demo: ${DEMO_EMAIL} / ${DEMO_PASSWORD} (código de invitación: ${DEMO_INVITE_CODE})`)
