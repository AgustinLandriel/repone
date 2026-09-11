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

  const info = db
    .prepare(`UPDATE orders SET status = 'sent', sent_at = datetime('now') WHERE id = ? AND status = 'draft'`)
    .run(id)

  if (info.changes === 0) {
    const exists = db.prepare('SELECT id FROM orders WHERE id = ?').get(id)
    return res.status(exists ? 409 : 404).json({ error: exists ? 'El pedido ya fue enviado' : 'Pedido no encontrado' })
  }

  res.json({ id, status: 'sent' })
})
