import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

function readSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('Falta la variable de entorno JWT_SECRET')
  return secret
}

const SECRET = readSecret()

// Duplicado a propósito, igual que en catalog-service — ver
// project_repone_microservices_migration.
export type SessionUser = {
  id: number
  email: string
  role: 'owner' | 'employee'
  businessId: number
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: SessionUser
  }
}

function bearerToken(req: Request): string | undefined {
  const header = req.headers.authorization
  return header?.startsWith('Bearer ') ? header.slice(7) : undefined
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = bearerToken(req)
  if (!token) return res.status(401).json({ error: 'No autenticado' })
  try {
    const payload = jwt.verify(token, SECRET) as unknown as {
      sub: number
      email: string
      role: 'owner' | 'employee'
      businessId: number
    }
    req.user = { id: payload.sub, email: payload.email, role: payload.role, businessId: payload.businessId }
    next()
  } catch {
    res.status(401).json({ error: 'No autenticado' })
  }
}
