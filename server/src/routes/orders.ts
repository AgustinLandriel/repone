import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { parseBody } from '../lib/http.js'

export const ordersRouter = Router()

const updateOrderSchema = z.object({
  status: z.literal('sent'),
})

ordersRouter.patch('/:id', (req, res) => {
  const id = Number(req.params.id)
  const body = parseBody(updateOrderSchema, req, res)
  if (!body) return

  const order = db
    .prepare(
      `SELECT o.id AS id, o.status AS status
       FROM orders o
       JOIN providers p ON p.id = o.provider_id
       WHERE o.id = ? AND p.business_id = ?`,
    )
    .get(id, req.user!.businessId) as { id: number; status: string } | undefined

  if (!order) return res.status(404).json({ error: 'Pedido no encontrado' })
  if (order.status === 'sent') return res.status(409).json({ error: 'El pedido ya fue enviado' })

  db.prepare(`UPDATE orders SET status = 'sent', sent_at = datetime('now') WHERE id = ?`).run(id)
  res.json({ id, status: 'sent' })
})
