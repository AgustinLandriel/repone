import type { Request, Response } from 'express'
import type { ZodSchema } from 'zod'

export function parseBody<T>(schema: ZodSchema<T>, req: Request, res: Response): T | undefined {
  const result = schema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ error: 'Datos inválidos', issues: result.error.issues })
    return undefined
  }
  return result.data
}
