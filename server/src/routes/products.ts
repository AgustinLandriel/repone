import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { parseBody } from '../lib/http.js'
import { requireRole } from '../lib/auth.js'

export const productsRouter = Router()

productsRouter.get('/by-barcode/:barcode', (req, res) => {
  const row = db
    .prepare(
      `SELECT
        pr.id AS id, pr.name AS name, pr.barcode AS barcode,
        pr.provider_id AS providerId, p.name AS providerName,
        pr.purchase_price AS purchase, pr.sale_price AS sale,
        pr.current_stock AS currentStock, pr.reorder_point AS reorderPoint,
        pr.last_stock_at AS lastStockAt
      FROM products pr
      JOIN providers p ON p.id = pr.provider_id
      WHERE pr.barcode = ? AND pr.business_id = ?`,
    )
    .get(req.params.barcode, req.user!.businessId)

  if (!row) return res.status(404).json({ error: 'Producto no encontrado' })
  res.json(row)
})

const createProductSchema = z.object({
  name: z.string().min(1),
  barcode: z.string().min(1),
  providerId: z.number().int().positive(),
  purchase: z.number().nonnegative(),
  sale: z.number().nonnegative(),
  reorderPoint: z.number().int().nonnegative().default(10),
  initialStock: z.number().int().nonnegative().default(0),
})

productsRouter.post('/', requireRole('owner'), (req, res) => {
  const body = parseBody(createProductSchema, req, res)
  if (!body) return

  const provider = db.prepare('SELECT id FROM providers WHERE id = ? AND business_id = ?').get(body.providerId, req.user!.businessId)
  if (!provider) return res.status(404).json({ error: 'Proveedor no encontrado' })

  const existing = db.prepare('SELECT id FROM products WHERE barcode = ? AND business_id = ?').get(body.barcode, req.user!.businessId)
  if (existing) return res.status(409).json({ error: 'Ya existe un producto con ese código de barras' })

  const insert = db.prepare(
    `INSERT INTO products (business_id, name, barcode, provider_id, purchase_price, sale_price, current_stock, reorder_point, last_stock_at)
     VALUES (@businessId, @name, @barcode, @providerId, @purchase, @sale, @initialStock, @reorderPoint, datetime('now'))`,
  )
  const info = insert.run({ ...body, businessId: req.user!.businessId })

  res.status(201).json({ id: Number(info.lastInsertRowid), ...body, currentStock: body.initialStock })
})

const updateStockSchema = z.object({
  stock: z.number().int().nonnegative(),
})

productsRouter.patch('/:id/stock', (req, res) => {
  const id = Number(req.params.id)
  const body = parseBody(updateStockSchema, req, res)
  if (!body) return

  const info = db
    .prepare(`UPDATE products SET current_stock = ?, last_stock_at = datetime('now') WHERE id = ? AND business_id = ?`)
    .run(body.stock, id, req.user!.businessId)

  if (info.changes === 0) return res.status(404).json({ error: 'Producto no encontrado' })
  res.json({ id, currentStock: body.stock })
})
