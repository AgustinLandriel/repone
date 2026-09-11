import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { parseBody } from '../lib/http.js'
import { requireRole } from '../lib/auth.js'

export const providersRouter = Router()

providersRouter.get('/', (req, res) => {
  const rows = db
    .prepare(
      `SELECT
        p.id AS id,
        p.name AS name,
        (SELECT COUNT(*) FROM products pr WHERE pr.provider_id = p.id) AS productCount,
        (SELECT o.status FROM orders o WHERE o.provider_id = p.id ORDER BY o.created_at DESC, o.id DESC LIMIT 1) AS latestStatus
      FROM providers p
      WHERE p.business_id = ?
      ORDER BY p.id`,
    )
    .all(req.user!.businessId) as { id: number; name: string; productCount: number; latestStatus: string | null }[]

  res.json(
    rows.map((r) => ({
      id: r.id,
      name: r.name,
      productCount: r.productCount,
      pending: r.latestStatus !== 'sent',
    })),
  )
})

const createProviderSchema = z.object({
  name: z.string().min(1),
})

providersRouter.post('/', requireRole('owner'), (req, res) => {
  const body = parseBody(createProviderSchema, req, res)
  if (!body) return

  const existing = db.prepare('SELECT id FROM providers WHERE business_id = ? AND name = ?').get(req.user!.businessId, body.name)
  if (existing) return res.status(409).json({ error: 'Ya existe un proveedor con ese nombre' })

  const info = db.prepare('INSERT INTO providers (business_id, name) VALUES (?, ?)').run(req.user!.businessId, body.name)
  res.status(201).json({ id: Number(info.lastInsertRowid), name: body.name, productCount: 0, pending: false })
})

providersRouter.get('/:id/order-items', (req, res) => {
  const providerId = Number(req.params.id)
  const provider = db.prepare('SELECT id FROM providers WHERE id = ? AND business_id = ?').get(providerId, req.user!.businessId)
  if (!provider) return res.status(404).json({ error: 'Proveedor no encontrado' })

  const products = db
    .prepare(
      `SELECT id, name, current_stock AS currentStock, reorder_point AS reorderPoint, purchase_price AS purchase
       FROM products WHERE provider_id = ? ORDER BY name`,
    )
    .all(providerId) as { id: number; name: string; currentStock: number; reorderPoint: number; purchase: number }[]

  res.json(
    products.map((p) => ({
      id: p.id,
      name: p.name,
      currentStock: p.currentStock,
      suggested: Math.max(0, p.reorderPoint - p.currentStock),
      purchase: p.purchase,
    })),
  )
})

const createOrderSchema = z.object({
  deliveryDate: z.string().min(1),
  nextDeliveryDate: z.string().min(1),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        finalQty: z.number().int().nonnegative(),
      }),
    )
    .min(1),
})

providersRouter.post('/:id/orders', (req, res) => {
  const providerId = Number(req.params.id)
  const provider = db.prepare('SELECT id FROM providers WHERE id = ? AND business_id = ?').get(providerId, req.user!.businessId)
  if (!provider) return res.status(404).json({ error: 'Proveedor no encontrado' })

  const body = parseBody(createOrderSchema, req, res)
  if (!body) return

  const getProduct = db.prepare(
    'SELECT current_stock AS currentStock, reorder_point AS reorderPoint, purchase_price AS purchase FROM products WHERE id = ? AND provider_id = ?',
  )
  const insertOrder = db.prepare(
    `INSERT INTO orders (provider_id, delivery_date, next_delivery_date) VALUES (?, ?, ?)`,
  )
  const insertItem = db.prepare(
    `INSERT INTO order_items (order_id, product_id, current_stock_snapshot, suggested_qty, final_qty, purchase_price_snapshot)
     VALUES (@orderId, @productId, @currentStock, @suggestedQty, @finalQty, @purchase)`,
  )

  db.exec('BEGIN')
  try {
    const orderInfo = insertOrder.run(providerId, body.deliveryDate, body.nextDeliveryDate)
    const orderId = Number(orderInfo.lastInsertRowid)

    for (const item of body.items) {
      const product = getProduct.get(item.productId, providerId) as
        | { currentStock: number; reorderPoint: number; purchase: number }
        | undefined
      if (!product) throw new Error(`Producto ${item.productId} no pertenece a este proveedor`)

      insertItem.run({
        orderId,
        productId: item.productId,
        currentStock: product.currentStock,
        suggestedQty: Math.max(0, product.reorderPoint - product.currentStock),
        finalQty: item.finalQty,
        purchase: product.purchase,
      })
    }
    db.exec('COMMIT')

    res.status(201).json({ id: orderId, providerId, status: 'draft', ...body })
  } catch (err) {
    db.exec('ROLLBACK')
    res.status(400).json({ error: err instanceof Error ? err.message : 'No se pudo crear el pedido' })
  }
})
