import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export const JWT_SECRET = process.env.JWT_SECRET || 'pharmacy-inventory-secret-2026'
export const JWT_EXPIRES_IN = '24h'

export interface JwtPayload {
  id: number
  username: string
  role: 'admin' | 'viewer'
  displayName: string
}

export interface AuthRequest extends Request {
  user?: JwtPayload
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: '認証が必要です' })
    return
  }

  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload
    req.user = payload
    next()
  } catch {
    res.status(401).json({ error: 'トークンが無効または期限切れです' })
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: '管理者権限が必要です' })
    return
  }
  next()
}
