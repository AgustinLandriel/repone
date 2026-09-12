import { randomBytes } from 'node:crypto'
import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { parseBody } from '../lib/http.js'
import { hashPassword, verifyPassword } from '../lib/password.js'
import { signToken, verifyToken, bearerToken } from '../lib/jwt.js'

export const authRouter = Router()

function generateInviteCode(): string {
  const exists = db.prepare('SELECT 1 FROM businesses WHERE invite_code = ?')
  let code: string
  do {
    code = randomBytes(4).toString('hex').toUpperCase()
  } while (exists.get(code))
  return code
}

type UserRow = {
  id: number
  email: string
  role: 'owner' | 'employee'
  businessId: number
  businessName: string
  inviteCode: string
}

function loadUser(userId: number): UserRow {
  return db
    .prepare(
      `SELECT u.id AS id, u.email AS email, u.role AS role,
              b.id AS businessId, b.name AS businessName, b.invite_code AS inviteCode
       FROM users u JOIN businesses b ON b.id = u.business_id
       WHERE u.id = ?`,
    )
    .get(userId) as UserRow
}

function tokenResponse(userId: number) {
  const u = loadUser(userId)
  const token = signToken({
    sub: u.id,
    email: u.email,
    role: u.role,
    businessId: u.businessId,
    businessName: u.businessName,
    inviteCode: u.inviteCode,
  })
  return {
    token,
    user: { id: u.id, email: u.email, role: u.role },
    business: { id: u.businessId, name: u.businessName, inviteCode: u.inviteCode },
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

  res.status(201).json(tokenResponse(userId))
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

  res.status(201).json(tokenResponse(userId))
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

  res.json(tokenResponse(user.id))
})

authRouter.get('/me', (req, res) => {
  const token = bearerToken(req)
  const payload = token ? verifyToken(token) : undefined
  if (!payload) return res.status(401).json({ error: 'Sesión inválida' })

  res.json({
    user: { id: payload.sub, email: payload.email, role: payload.role },
    business: { id: payload.businessId, name: payload.businessName, inviteCode: payload.inviteCode },
  })
})

authRouter.post('/logout', (_req, res) => {
  // Sin estado server-side (JWT): el cliente borra el token y listo, ver nota en lib/jwt.ts
  res.status(204).end()
})
