import { randomBytes } from 'node:crypto'
import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { parseBody } from '../lib/http.js'
import { hashPassword, verifyPassword } from '../lib/password.js'
import { bearerToken, findSessionUser } from '../lib/auth.js'

export const authRouter = Router()

function createSession(userId: number): string {
  const token = randomBytes(32).toString('hex')
  db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, userId)
  return token
}

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['owner', 'employee']).default('owner'),
})

authRouter.post('/register', (req, res) => {
  const body = parseBody(registerSchema, req, res)
  if (!body) return

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(body.email)
  if (existing) return res.status(409).json({ error: 'Ya existe una cuenta con ese email' })

  const info = db
    .prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)')
    .run(body.email, hashPassword(body.password), body.role)

  const userId = Number(info.lastInsertRowid)
  const token = createSession(userId)

  res.status(201).json({ token, user: { id: userId, email: body.email, role: body.role } })
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

authRouter.post('/login', (req, res) => {
  const body = parseBody(loginSchema, req, res)
  if (!body) return

  const user = db.prepare('SELECT id, email, password_hash, role FROM users WHERE email = ?').get(body.email) as
    | { id: number; email: string; password_hash: string; role: string }
    | undefined

  if (!user || !verifyPassword(body.password, user.password_hash)) {
    return res.status(401).json({ error: 'Email o contraseña incorrectos' })
  }

  const token = createSession(user.id)
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } })
})

authRouter.get('/me', (req, res) => {
  const token = bearerToken(req)
  const user = token ? findSessionUser(token) : undefined
  if (!user) return res.status(401).json({ error: 'Sesión inválida' })
  res.json({ user })
})

authRouter.post('/logout', (req, res) => {
  const token = bearerToken(req)
  if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token)
  res.status(204).end()
})
