import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'

// Rutas service-to-service, sólo para orders-service — no pasan por requireAuth
// (no llegan público, el Ingress de k8s nunca expone el prefijo /internal).
// businessId viaja explícito en query/body porque acá no hay JWT que verificar.
export const internalRouter = Router()

internalRouter.get('/providers/:id', (req, res) => {
  const providerId = Number(req.params.id)
  const businessId = Number(req.query.businessId)
  if (!businessId) return res.status(400).json({ error: 'Falta businessId' })

  const provider = db.prepare('SELECT id, name FROM providers WHERE id = ? AND business_id = ?').get(providerId, businessId) as
    | { id: number; name: string }
    | undefined

  if (!provider) return res.status(404).json({ error: 'Proveedor no encontrado' })
  res.json(provider)
})

const snapshotSchema = z.object({
  businessId: z.number().int().positive(),
  providerId: z.number().int().positive(),
  productIds: z.array(z.number().int().positive()).min(1),
})

internalRouter.post('/order-items/snapshot', (req, res) => {
  const result = snapshotSchema.safeParse(req.body)
  if (!result.success) return res.status(400).json({ error: 'Datos inválidos', issues: result.error.issues })
  const { businessId, providerId, productIds } = result.data

  const placeholders = productIds.map(() => '?').join(',')
  const rows = db
    .prepare(
      `SELECT id, current_stock AS currentStock, reorder_point AS reorderPoint, purchase_price AS purchase
       FROM products
       WHERE business_id = ? AND provider_id = ? AND id IN (${placeholders})`,
    )
    .all(businessId, providerId, ...productIds) as { id: number; currentStock: number; reorderPoint: number; purchase: number }[]

  res.json(rows)
})
