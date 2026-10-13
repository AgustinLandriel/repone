import express from 'express'
import { register, metricsMiddleware } from './lib/metrics.js'
import { authRouter } from './routes/auth.js'

const app = express()
app.use(express.json())
app.use(metricsMiddleware)

app.get('/healthz', (_req, res) => res.status(200).send('ok'))
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType)
  res.send(await register.metrics())
})
app.use('/api/auth', authRouter)

const PORT = Number(process.env.PORT) || 3001
app.listen(PORT, () => {
  console.log(`auth-service escuchando en http://localhost:${PORT}`)
})
