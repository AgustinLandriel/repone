import express from 'express'
import { providersRouter } from './routes/providers.js'
import { productsRouter } from './routes/products.js'
import { ordersRouter } from './routes/orders.js'

const app = express()
app.use(express.json())

app.use('/api/providers', providersRouter)
app.use('/api/products', productsRouter)
app.use('/api/orders', ordersRouter)

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Reponé API escuchando en http://localhost:${PORT}`)
})
