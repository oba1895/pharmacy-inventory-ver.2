import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { authenticate, AuthRequest, JWT_SECRET, JWT_EXPIRES_IN } from '../middleware/auth'

const router = Router()

// POST /api/auth/pin - 管理者PINログイン
router.post('/pin', (req: Request, res: Response): void => {
  const { pin } = req.body
  const adminPin = process.env.ADMIN_PIN || '1234'

  if (pin !== '' && String(pin) !== String(adminPin)) {
    res.status(401).json({ error: 'PINが違います' })
    return
  }

  const payload = { id: 0, username: 'admin', role: 'admin' as const, displayName: '管理者' }
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })

  res.json({ token, user: payload })
})

// GET /api/auth/me
router.get('/me', authenticate, (req: AuthRequest, res: Response): void => {
  res.json({ user: req.user })
})

export default router
