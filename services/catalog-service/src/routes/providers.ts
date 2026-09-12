import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { parseBody } from '../lib/http.js'
import { requireRole } from '../lib/verifyJwt.js'

export const providersRouter = Router()

// "pending" (si el último pedido a este proveedor ya se mandó o no) vive en orders-service
// y se compone del lado del cliente — ver client/src/api.ts (getProviders) y
// project_repone_microservices_migration para el porqué de esta separación.
providersRouter.get('/', (req, res) => {
  const rows = db
    .prepare(
      `SELECT
        p.id AS id,
        p.name AS name,
        (SELECT COUNT(*) FROM products pr WHERE pr.provider_id = p.id) AS productCount
      FROM providers p
      WHERE p.business_id = ?
      ORDER BY p.id`,
    )
    .all(req.user!.businessId) as { id: number; name: string; productCount: number }[]

  res.json(rows)
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
  res.status(201).json({ id: Number(info.lastInsertRowid), name: body.name, productCount: 0 })
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
