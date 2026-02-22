import { Router, Response } from 'express'
import { db } from '../database'
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth'

const router = Router()

// ---- 購入先 (Suppliers) ----

router.get('/suppliers', authenticate, (_req: AuthRequest, res: Response): void => {
  res.json(db.prepare('SELECT * FROM suppliers ORDER BY name').all())
})

router.post('/suppliers', authenticate, requireAdmin, (req: AuthRequest, res: Response): void => {
  const { name } = req.body
  if (!name?.trim()) { res.status(400).json({ error: '購入先名を入力してください' }); return }
  if (db.prepare('SELECT id FROM suppliers WHERE name = ?').get(name.trim())) {
    res.status(409).json({ error: '同じ名前の購入先が既に存在します' }); return
  }
  const r = db.prepare('INSERT INTO suppliers (name) VALUES (?)').run(name.trim())
  res.status(201).json(db.prepare('SELECT * FROM suppliers WHERE id = ?').get(r.lastInsertRowid))
})

router.delete('/suppliers/:id', authenticate, requireAdmin, (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id)
  const count = (db.prepare('SELECT COUNT(*) as c FROM transactions WHERE supplier_id = ?').get(id) as { c: number }).c
  if (count > 0) { res.status(409).json({ error: 'この購入先には受払履歴があるため削除できません' }); return }
  db.prepare('DELETE FROM suppliers WHERE id = ?').run(id)
  res.json({ success: true })
})

// ---- 薬剤師 (Pharmacists) ----

router.get('/pharmacists', authenticate, (_req: AuthRequest, res: Response): void => {
  res.json(db.prepare('SELECT * FROM pharmacists ORDER BY name').all())
})

router.post('/pharmacists', authenticate, requireAdmin, (req: AuthRequest, res: Response): void => {
  const { name } = req.body
  if (!name?.trim()) { res.status(400).json({ error: '薬剤師名を入力してください' }); return }
  if (db.prepare('SELECT id FROM pharmacists WHERE name = ?').get(name.trim())) {
    res.status(409).json({ error: '同じ名前の薬剤師が既に存在します' }); return
  }
  const r = db.prepare('INSERT INTO pharmacists (name) VALUES (?)').run(name.trim())
  res.status(201).json(db.prepare('SELECT * FROM pharmacists WHERE id = ?').get(r.lastInsertRowid))
})

router.delete('/pharmacists/:id', authenticate, requireAdmin, (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id)
  const count = (db.prepare('SELECT COUNT(*) as c FROM transactions WHERE pharmacist_id = ?').get(id) as { c: number }).c
  if (count > 0) { res.status(409).json({ error: 'この薬剤師には受払履歴があるため削除できません' }); return }
  db.prepare('DELETE FROM pharmacists WHERE id = ?').run(id)
  res.json({ success: true })
})

// ---- 病棟 (Wards) ----

router.get('/wards', authenticate, (_req: AuthRequest, res: Response): void => {
  res.json(db.prepare('SELECT * FROM wards ORDER BY name').all())
})

router.post('/wards', authenticate, requireAdmin, (req: AuthRequest, res: Response): void => {
  const { name } = req.body
  if (!name?.trim()) { res.status(400).json({ error: '病棟名を入力してください' }); return }
  if (db.prepare('SELECT id FROM wards WHERE name = ?').get(name.trim())) {
    res.status(409).json({ error: '同じ名前の病棟が既に存在します' }); return
  }
  const r = db.prepare('INSERT INTO wards (name) VALUES (?)').run(name.trim())
  res.status(201).json(db.prepare('SELECT * FROM wards WHERE id = ?').get(r.lastInsertRowid))
})

router.delete('/wards/:id', authenticate, requireAdmin, (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id)
  const count = (db.prepare('SELECT COUNT(*) as c FROM transactions WHERE ward_id = ?').get(id) as { c: number }).c
  if (count > 0) { res.status(409).json({ error: 'この病棟には受払履歴があるため削除できません' }); return }
  db.prepare('DELETE FROM wards WHERE id = ?').run(id)
  res.json({ success: true })
})

export default router
