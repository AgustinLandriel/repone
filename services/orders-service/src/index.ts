import express from 'express'
import { ordersRouter } from './routes/orders.js'
import { requireAuth } from './lib/verifyJwt.js'

const app = express()
app.use(express.json())

app.get('/healthz', (_req, res) => res.status(200).send('ok'))
app.use('/api/orders', requireAuth, ordersRouter)

const PORT = Number(process.env.PORT) || 3003
app.listen(PORT, () => {
  console.log(`orders-service escuchando en http://localhost:${PORT}`)
})
