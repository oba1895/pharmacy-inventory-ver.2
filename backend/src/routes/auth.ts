import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '../database'
import { authenticate, AuthRequest, JWT_SECRET, JWT_EXPIRES_IN } from '../middleware/auth'

const router = Router()

// POST /api/auth/login
router.post('/login', (req: Request, res: Response): void => {
  const { username, password } = req.body
  if (!username || !password) {
    res.status(400).json({ error: 'ユーザー名とパスワードを入力してください' })
    return
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as {
    id: number; username: string; password_hash: string; role: 'admin' | 'viewer'; display_name: string
  } | undefined

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'ユーザー名またはパスワードが違います' })
    return
  }

  const payload = { id: user.id, username: user.username, role: user.role, displayName: user.display_name }
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })

  res.json({ token, user: { id: user.id, username: user.username, role: user.role, displayName: user.display_name } })
})

// GET /api/auth/me
router.get('/me', authenticate, (req: AuthRequest, res: Response): void => {
  res.json({ user: req.user })
})

export default router
