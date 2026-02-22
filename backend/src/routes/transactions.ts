import { Router, Response } from 'express'
import { db } from '../database'
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth'

const router = Router()

const TX_SELECT = `
  SELECT
    t.id, t.medicine_id, t.transaction_type, t.quantity,
    t.patient_name, t.date, t.supplier_id, t.pharmacist_id,
    t.ward_id, t.notes, t.created_at,
    m.name  AS medicine_name,
    s.name  AS supplier_name,
    p.name  AS pharmacist_name,
    w.name  AS ward_name
  FROM transactions t
  JOIN medicines m ON t.medicine_id = m.id
  LEFT JOIN suppliers s ON t.supplier_id = s.id
  JOIN pharmacists p ON t.pharmacist_id = p.id
  LEFT JOIN wards w ON t.ward_id = w.id
`

// GET /api/transactions - 受払履歴取得（全権限）
router.get('/', authenticate, (req: AuthRequest, res: Response): void => {
  const { medicine_id, transaction_type, start_date, end_date } = req.query
  let where = 'WHERE 1=1'
  const params: (string | number)[] = []

  if (medicine_id) { where += ' AND t.medicine_id = ?'; params.push(Number(medicine_id)) }
  if (transaction_type) { where += ' AND t.transaction_type = ?'; params.push(String(transaction_type)) }
  if (start_date) { where += ' AND t.date >= ?'; params.push(String(start_date)) }
  if (end_date) { where += ' AND t.date <= ?'; params.push(String(end_date)) }

  const transactions = db.prepare(`${TX_SELECT} ${where} ORDER BY t.date DESC, t.created_at DESC`).all(...params)
  res.json(transactions)
})

// POST /api/transactions - 受払登録（管理者のみ）
router.post('/', authenticate, requireAdmin, (req: AuthRequest, res: Response): void => {
  const { medicine_id, transaction_type, quantity, patient_name, date, supplier_id, pharmacist_id, ward_id, notes } = req.body

  if (!medicine_id || !transaction_type || !quantity || !date || !pharmacist_id) {
    res.status(400).json({ error: '必須項目（医薬品名・入出庫区分・数量・日付・薬剤師名）が未入力です' })
    return
  }
  if (!['入庫', '出庫'].includes(transaction_type)) {
    res.status(400).json({ error: '入出庫区分が不正です' })
    return
  }
  const qty = parseInt(quantity)
  if (isNaN(qty) || qty <= 0) {
    res.status(400).json({ error: '数量は1以上の整数を入力してください' })
    return
  }

  const medicine = db.prepare('SELECT current_stock FROM medicines WHERE id = ?').get(medicine_id) as
    { current_stock: number } | undefined
  if (!medicine) {
    res.status(404).json({ error: '医薬品が見つかりません' })
    return
  }
  if (transaction_type === '出庫' && medicine.current_stock < qty) {
    res.status(400).json({ error: `在庫数が不足しています（現在の在庫: ${medicine.current_stock}）` })
    return
  }

  const stockChange = transaction_type === '入庫' ? qty : -qty

  const doInsert = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO transactions (medicine_id, transaction_type, quantity, patient_name, date, supplier_id, pharmacist_id, ward_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      medicine_id, transaction_type, qty,
      patient_name || null, date,
      supplier_id || null, pharmacist_id,
      ward_id || null,
      notes || null
    )
    db.prepare(`
      UPDATE medicines SET current_stock = current_stock + ?, updated_at = datetime('now', 'localtime') WHERE id = ?
    `).run(stockChange, medicine_id)
    return result.lastInsertRowid
  })

  const id = doInsert()
  const tx = db.prepare(`${TX_SELECT} WHERE t.id = ?`).get(id)
  res.status(201).json(tx)
})

// PUT /api/transactions/:id - 受払編集（管理者のみ）
router.put('/:id', authenticate, requireAdmin, (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id)
  const { medicine_id, transaction_type, quantity, patient_name, date, supplier_id, pharmacist_id, ward_id, notes } = req.body

  if (!medicine_id || !transaction_type || !quantity || !date || !pharmacist_id) {
    res.status(400).json({ error: '必須項目が未入力です' })
    return
  }
  const qty = parseInt(quantity)
  if (isNaN(qty) || qty <= 0) {
    res.status(400).json({ error: '数量は1以上の整数を入力してください' })
    return
  }

  const old = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as
    { medicine_id: number; transaction_type: string; quantity: number } | undefined
  if (!old) {
    res.status(404).json({ error: 'レコードが見つかりません' })
    return
  }

  // 在庫チェック: 旧データを元に戻した後に新データを適用できるか
  const oldEffect = old.transaction_type === '入庫' ? old.quantity : -old.quantity
  const newEffect = transaction_type === '入庫' ? qty : -qty
  const netChange = -oldEffect + newEffect

  // 旧医薬品と新医薬品が異なる場合は個別に処理
  if (old.medicine_id !== Number(medicine_id)) {
    const oldMed = db.prepare('SELECT current_stock FROM medicines WHERE id = ?').get(old.medicine_id) as { current_stock: number }
    const newMed = db.prepare('SELECT current_stock FROM medicines WHERE id = ?').get(medicine_id) as { current_stock: number } | undefined
    if (!newMed) { res.status(404).json({ error: '医薬品が見つかりません' }); return }

    const oldReversed = oldMed.current_stock - oldEffect
    if (oldReversed < 0) {
      res.status(400).json({ error: `旧医薬品の在庫を元に戻すと数量が不足します（現在の在庫: ${oldMed.current_stock}）` }); return
    }
    if (transaction_type === '出庫' && newMed.current_stock < qty) {
      res.status(400).json({ error: `在庫数が不足しています（${newMed.current_stock}）` }); return
    }

    db.transaction(() => {
      db.prepare('UPDATE medicines SET current_stock = current_stock + ?, updated_at = datetime(\'now\', \'localtime\') WHERE id = ?').run(-oldEffect, old.medicine_id)
      db.prepare('UPDATE medicines SET current_stock = current_stock + ?, updated_at = datetime(\'now\', \'localtime\') WHERE id = ?').run(newEffect, medicine_id)
      db.prepare(`
        UPDATE transactions SET medicine_id=?, transaction_type=?, quantity=?, patient_name=?, date=?,
          supplier_id=?, pharmacist_id=?, ward_id=?, notes=? WHERE id=?
      `).run(medicine_id, transaction_type, qty, patient_name || null, date, supplier_id || null, pharmacist_id, ward_id || null, notes || null, id)
    })()
  } else {
    const currentStock = (db.prepare('SELECT current_stock FROM medicines WHERE id = ?').get(medicine_id) as { current_stock: number }).current_stock
    const projectedStock = currentStock + netChange
    if (projectedStock < 0) {
      res.status(400).json({ error: `在庫数が不足します（計算後: ${projectedStock}）` }); return
    }

    db.transaction(() => {
      db.prepare('UPDATE medicines SET current_stock = current_stock + ?, updated_at = datetime(\'now\', \'localtime\') WHERE id = ?').run(netChange, medicine_id)
      db.prepare(`
        UPDATE transactions SET medicine_id=?, transaction_type=?, quantity=?, patient_name=?, date=?,
          supplier_id=?, pharmacist_id=?, ward_id=?, notes=? WHERE id=?
      `).run(medicine_id, transaction_type, qty, patient_name || null, date, supplier_id || null, pharmacist_id, ward_id || null, notes || null, id)
    })()
  }

  const updated = db.prepare(`${TX_SELECT} WHERE t.id = ?`).get(id)
  res.json(updated)
})

// DELETE /api/transactions/:id - 受払削除（管理者のみ）
router.delete('/:id', authenticate, requireAdmin, (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id)
  const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as
    { medicine_id: number; transaction_type: string; quantity: number } | undefined
  if (!tx) {
    res.status(404).json({ error: 'レコードが見つかりません' }); return
  }

  const reverseEffect = tx.transaction_type === '入庫' ? -tx.quantity : tx.quantity

  db.transaction(() => {
    db.prepare('UPDATE medicines SET current_stock = current_stock + ?, updated_at = datetime(\'now\', \'localtime\') WHERE id = ?').run(reverseEffect, tx.medicine_id)
    db.prepare('DELETE FROM transactions WHERE id = ?').run(id)
  })()

  res.json({ success: true })
})

export default router
