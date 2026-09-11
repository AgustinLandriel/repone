import express from 'express'
import { authRouter } from './routes/auth.js'
import { providersRouter } from './routes/providers.js'
import { productsRouter } from './routes/products.js'
import { ordersRouter } from './routes/orders.js'
import { requireAuth } from './lib/auth.js'

const app = express()
app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api/providers', requireAuth, providersRouter)
app.use('/api/products', requireAuth, productsRouter)
app.use('/api/orders', requireAuth, ordersRouter)

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Reponé API escuchando en http://localhost:${PORT}`)
})
