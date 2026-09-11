import type { NextFunction, Request, Response } from 'express'
import { db } from '../db.js'

export type SessionUser = {
  id: number
  email: string
  role: 'owner' | 'employee'
  businessId: number
  businessName: string
  inviteCode: string
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: SessionUser
  }
}

export function bearerToken(req: Request): string | undefined {
  const header = req.headers.authorization
  return header?.startsWith('Bearer ') ? header.slice(7) : undefined
}

export function findSessionUser(token: string): SessionUser | undefined {
  return db
    .prepare(
      `SELECT u.id AS id, u.email AS email, u.role AS role,
              b.id AS businessId, b.name AS businessName, b.invite_code AS inviteCode
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       JOIN businesses b ON b.id = u.business_id
       WHERE s.token = ?`,
    )
    .get(token) as SessionUser | undefined
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = bearerToken(req)
  const user = token ? findSessionUser(token) : undefined
  if (!user) return res.status(401).json({ error: 'No autenticado' })
  req.user = user
  next()
}

export function requireRole(...roles: SessionUser['role'][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tenés permiso para hacer esto' })
    }
    next()
  }
}
