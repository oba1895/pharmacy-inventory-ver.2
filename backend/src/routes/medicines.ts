import { Router, Response } from 'express'
import { db } from '../database'
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth'

const router = Router()

// GET /api/medicines - 在庫一覧取得（認証不要）
router.get('/', (_req: AuthRequest, res: Response): void => {
  const medicines = db.prepare(`
    SELECT id, name, current_stock, unit, updated_at
    FROM medicines
    ORDER BY name
  `).all()
  res.json(medicines)
})

// POST /api/medicines - 医薬品追加（管理者のみ）
router.post('/', authenticate, requireAdmin, (req: AuthRequest, res: Response): void => {
  const { name, unit } = req.body
  if (!name || !name.trim()) {
    res.status(400).json({ error: '医薬品名を入力してください' })
    return
  }

  const existing = db.prepare('SELECT id FROM medicines WHERE name = ?').get(name.trim())
  if (existing) {
    res.status(409).json({ error: '同じ名前の医薬品が既に存在します' })
    return
  }

  const result = db.prepare('INSERT INTO medicines (name, unit, current_stock) VALUES (?, ?, 0)').run(
    name.trim(),
    (unit || '錠').trim()
  )
  const medicine = db.prepare('SELECT * FROM medicines WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(medicine)
})

// POST /api/medicines/bulk - 医薬品の一括追加（管理者のみ）
router.post('/bulk', authenticate, requireAdmin, (req: AuthRequest, res: Response): void => {
  const { items } = req.body as { items?: { name?: string; unit?: string }[] }
  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: '追加するデータがありません' })
    return
  }

  const insert = db.prepare('INSERT INTO medicines (name, unit, current_stock) VALUES (?, ?, 0)')
  const existsStmt = db.prepare('SELECT id FROM medicines WHERE name = ?')

  const result = { added: 0, skipped: 0, errors: [] as string[] }
  const seen = new Set<string>()

  const run = db.transaction((rows: { name?: string; unit?: string }[]) => {
    rows.forEach((row, i) => {
      const name = (row.name || '').trim()
      const unit = (row.unit || '錠').trim() || '錠'
      if (!name) { result.errors.push(`${i + 1}行目: 医薬品名が空です`); return }
      const key = name.toLowerCase()
      if (seen.has(key) || existsStmt.get(name)) { result.skipped++; return }
      seen.add(key)
      insert.run(name, unit)
      result.added++
    })
  })
  run(items)

  res.json(result)
})

// DELETE /api/medicines/:id - 医薬品削除（管理者のみ）
router.delete('/:id', authenticate, requireAdmin, (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id)
  const txCount = (db.prepare('SELECT COUNT(*) as count FROM transactions WHERE medicine_id = ?').get(id) as { count: number }).count
  if (txCount > 0) {
    res.status(409).json({ error: 'この医薬品には受払履歴があるため削除できません' })
    return
  }
  db.prepare('DELETE FROM medicines WHERE id = ?').run(id)
  res.json({ success: true })
})

export default router
