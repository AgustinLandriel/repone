import type { Request, Response } from 'express'
import type { ZodType } from 'zod'

export function parseBody<T>(schema: ZodType<T, any, any>, req: Request, res: Response): T | undefined {
  const result = schema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ error: 'Datos inválidos', issues: result.error.issues })
    return undefined
  }
  return result.data
}
