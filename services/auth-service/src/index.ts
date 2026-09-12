import express from 'express'
import { authRouter } from './routes/auth.js'

const app = express()
app.use(express.json())

app.get('/healthz', (_req, res) => res.status(200).send('ok'))
app.use('/api/auth', authRouter)

const PORT = Number(process.env.PORT) || 3001
app.listen(PORT, () => {
  console.log(`auth-service escuchando en http://localhost:${PORT}`)
})
