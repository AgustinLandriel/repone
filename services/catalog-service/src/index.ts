import express from 'express'
import { register, metricsMiddleware } from './lib/metrics.js'
import { providersRouter } from './routes/providers.js'
import { productsRouter } from './routes/products.js'
import { internalRouter } from './routes/internal.js'
import { requireAuth } from './lib/verifyJwt.js'

const app = express()
app.use(express.json())
app.use(metricsMiddleware)

app.get('/healthz', (_req, res) => res.status(200).send('ok'))
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType)
  res.send(await register.metrics())
})

app.use('/api/catalog/providers', requireAuth, providersRouter)
app.use('/api/catalog/products', requireAuth, productsRouter)
app.use('/internal', internalRouter)

const PORT = Number(process.env.PORT) || 3002
app.listen(PORT, () => {
  console.log(`catalog-service escuchando en http://localhost:${PORT}`)
})
