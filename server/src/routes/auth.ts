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

function generateInviteCode(): string {
  const exists = db.prepare('SELECT 1 FROM businesses WHERE invite_code = ?')
  let code: string
  do {
    code = randomBytes(4).toString('hex').toUpperCase()
  } while (exists.get(code))
  return code
}

function sessionResponse(userId: number) {
  const token = createSession(userId)
  // el usuario recién creado ya tiene sesión y fila en users/businesses, así que esto siempre encuentra algo
  const full = findSessionUser(token)!
  return {
    token,
    user: { id: full.id, email: full.email, role: full.role },
    business: { id: full.businessId, name: full.businessName, inviteCode: full.inviteCode },
  }
}

const registerBusinessSchema = z.object({
  businessName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
})

authRouter.post('/register-business', (req, res) => {
  const body = parseBody(registerBusinessSchema, req, res)
  if (!body) return

  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(body.email)
  if (existingUser) return res.status(409).json({ error: 'Ya existe una cuenta con ese email' })

  const businessId = Number(
    db.prepare('INSERT INTO businesses (name, invite_code) VALUES (?, ?)').run(body.businessName, generateInviteCode())
      .lastInsertRowid,
  )
  const userId = Number(
    db
      .prepare('INSERT INTO users (business_id, email, password_hash, role) VALUES (?, ?, ?, ?)')
      .run(businessId, body.email, hashPassword(body.password), 'owner').lastInsertRowid,
  )

  res.status(201).json(sessionResponse(userId))
})

const joinSchema = z.object({
  inviteCode: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
})

authRouter.post('/join', (req, res) => {
  const body = parseBody(joinSchema, req, res)
  if (!body) return

  const business = db.prepare('SELECT id FROM businesses WHERE invite_code = ?').get(body.inviteCode.toUpperCase()) as
    | { id: number }
    | undefined
  if (!business) return res.status(404).json({ error: 'Código de invitación inválido' })

  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(body.email)
  if (existingUser) return res.status(409).json({ error: 'Ya existe una cuenta con ese email' })

  const userId = Number(
    db
      .prepare('INSERT INTO users (business_id, email, password_hash, role) VALUES (?, ?, ?, ?)')
      .run(business.id, body.email, hashPassword(body.password), 'employee').lastInsertRowid,
  )

  res.status(201).json(sessionResponse(userId))
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

authRouter.post('/login', (req, res) => {
  const body = parseBody(loginSchema, req, res)
  if (!body) return

  const user = db.prepare('SELECT id, email, password_hash FROM users WHERE email = ?').get(body.email) as
    | { id: number; email: string; password_hash: string }
    | undefined

  if (!user || !verifyPassword(body.password, user.password_hash)) {
    return res.status(401).json({ error: 'Email o contraseña incorrectos' })
  }

  res.json(sessionResponse(user.id))
})

authRouter.get('/me', (req, res) => {
  const token = bearerToken(req)
  const full = token ? findSessionUser(token) : undefined
  if (!full) return res.status(401).json({ error: 'Sesión inválida' })

  res.json({
    user: { id: full.id, email: full.email, role: full.role },
    business: { id: full.businessId, name: full.businessName, inviteCode: full.inviteCode },
  })
})

authRouter.post('/logout', (req, res) => {
  const token = bearerToken(req)
  if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token)
  res.status(204).end()
})
