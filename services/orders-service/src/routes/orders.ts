import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { parseBody } from '../lib/http.js'
import { getProviderForBusiness, getProductSnapshots } from '../lib/catalogClient.js'

export const ordersRouter = Router()

const createOrderSchema = z.object({
  providerId: z.number().int().positive(),
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

ordersRouter.post('/', async (req, res) => {
  const body = parseBody(createOrderSchema, req, res)
  if (!body) return

  const provider = await getProviderForBusiness(body.providerId, req.user!.businessId)
  if (!provider) return res.status(404).json({ error: 'Proveedor no encontrado' })

  const productIds = body.items.map((item) => item.productId)
  const snapshots = await getProductSnapshots(req.user!.businessId, body.providerId, productIds)
  const snapshotById = new Map(snapshots.map((s) => [s.id, s]))

  const insertOrder = db.prepare(
    `INSERT INTO orders (business_id, provider_id, delivery_date, next_delivery_date) VALUES (?, ?, ?, ?)`,
  )
  const insertItem = db.prepare(
    `INSERT INTO order_items (order_id, product_id, current_stock_snapshot, suggested_qty, final_qty, purchase_price_snapshot)
     VALUES (@orderId, @productId, @currentStock, @suggestedQty, @finalQty, @purchase)`,
  )

  db.exec('BEGIN')
  try {
    const orderInfo = insertOrder.run(req.user!.businessId, body.providerId, body.deliveryDate, body.nextDeliveryDate)
    const orderId = Number(orderInfo.lastInsertRowid)

    for (const item of body.items) {
      const snapshot = snapshotById.get(item.productId)
      if (!snapshot) throw new Error(`Producto ${item.productId} no pertenece a este proveedor`)

      insertItem.run({
        orderId,
        productId: item.productId,
        currentStock: snapshot.currentStock,
        suggestedQty: Math.max(0, snapshot.reorderPoint - snapshot.currentStock),
        finalQty: item.finalQty,
        purchase: snapshot.purchase,
      })
    }
    db.exec('COMMIT')

    res.status(201).json({ id: orderId, status: 'draft', ...body })
  } catch (err) {
    db.exec('ROLLBACK')
    res.status(400).json({ error: err instanceof Error ? err.message : 'No se pudo crear el pedido' })
  }
})

const updateOrderSchema = z.object({
  status: z.literal('sent'),
})

ordersRouter.patch('/:id', (req, res) => {
  const id = Number(req.params.id)
  const body = parseBody(updateOrderSchema, req, res)
  if (!body) return

  const order = db.prepare('SELECT id, status FROM orders WHERE id = ? AND business_id = ?').get(id, req.user!.businessId) as
    | { id: number; status: string }
    | undefined

  if (!order) return res.status(404).json({ error: 'Pedido no encontrado' })
  if (order.status === 'sent') return res.status(409).json({ error: 'El pedido ya fue enviado' })

  db.prepare(`UPDATE orders SET status = 'sent', sent_at = datetime('now') WHERE id = ?`).run(id)
  res.json({ id, status: 'sent' })
})

// Le da a catalog-service el flag "pending" por proveedor (último pedido no enviado),
// que antes salía de un JOIN local con providers — ver client/src/api.ts (getProviders)
// para la composición del lado del cliente.
ordersRouter.get('/status-by-provider', (req, res) => {
  const rows = db
    .prepare(
      `SELECT provider_id AS providerId, status
       FROM orders
       WHERE business_id = ? AND id IN (
         SELECT MAX(id) FROM orders WHERE business_id = ? GROUP BY provider_id
       )`,
    )
    .all(req.user!.businessId, req.user!.businessId) as { providerId: number; status: string }[]

  res.json(Object.fromEntries(rows.map((r) => [r.providerId, r.status !== 'sent'])))
})
