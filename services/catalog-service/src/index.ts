import express from 'express'
import { providersRouter } from './routes/providers.js'
import { productsRouter } from './routes/products.js'
import { internalRouter } from './routes/internal.js'
import { requireAuth } from './lib/verifyJwt.js'

const app = express()
app.use(express.json())

app.get('/healthz', (_req, res) => res.status(200).send('ok'))

app.use('/api/catalog/providers', requireAuth, providersRouter)
app.use('/api/catalog/products', requireAuth, productsRouter)
app.use('/internal', internalRouter)

const PORT = Number(process.env.PORT) || 3002
app.listen(PORT, () => {
  console.log(`catalog-service escuchando en http://localhost:${PORT}`)
})
