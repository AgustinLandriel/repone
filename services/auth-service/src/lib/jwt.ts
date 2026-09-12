import type { Request } from 'express'
import jwt from 'jsonwebtoken'

function readSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('Falta la variable de entorno JWT_SECRET')
  return secret
}

const SECRET = readSecret()

export type TokenPayload = {
  sub: number
  email: string
  role: 'owner' | 'employee'
  businessId: number
  businessName: string
  inviteCode: string
}

// Token sin estado: no hay tabla de sesiones que invalidar, por eso vive 24hs nomás
// (compromiso consciente — logout server-side no es posible sin agregar una blocklist)
export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: '24h' })
}

export function verifyToken(token: string): TokenPayload | undefined {
  try {
    return jwt.verify(token, SECRET) as unknown as TokenPayload
  } catch {
    return undefined
  }
}

export function bearerToken(req: Request): string | undefined {
  const header = req.headers.authorization
  return header?.startsWith('Bearer ') ? header.slice(7) : undefined
}
