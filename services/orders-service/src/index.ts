import express from 'express'
import { register, metricsMiddleware } from './lib/metrics.js'
import { ordersRouter } from './routes/orders.js'
import { requireAuth } from './lib/verifyJwt.js'

const app = express()
app.use(express.json())
app.use(metricsMiddleware)

app.get('/healthz', (_req, res) => res.status(200).send('ok'))
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType)
  res.send(await register.metrics())
})
app.use('/api/orders', requireAuth, ordersRouter)

const PORT = Number(process.env.PORT) || 3003
app.listen(PORT, () => {
  console.log(`orders-service escuchando en http://localhost:${PORT}`)
})
