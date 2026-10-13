import { Registry, collectDefaultMetrics, Histogram } from 'prom-client'
import type { Request, Response, NextFunction } from 'express'

export const register = new Registry()
collectDefaultMetrics({ register })

const httpDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duración de requests HTTP',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
})

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const end = httpDuration.startTimer()
  res.on('finish', () => {
    const route = req.route?.path ? `${req.baseUrl}${req.route.path}` : 'unmatched'
    end({ method: req.method, route, status: res.statusCode })
  })
  next()
}
