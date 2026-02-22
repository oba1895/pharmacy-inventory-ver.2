import React, { useState, useEffect } from 'react'
import { Medicine, Supplier, Pharmacist, Ward, Transaction } from '../types'
import client from '../api/client'

interface Props {
  medicines: Medicine[]
  suppliers: Supplier[]
  pharmacists: Pharmacist[]
  wards: Ward[]
  editingTransaction: Transaction | null
  onSuccess: () => void
  onCancelEdit: () => void
}

interface FormData {
  medicine_id: string
  transaction_type: '入庫' | '出庫'
  quantity: string
  patient_name: string
  date: string
  supplier_id: string
  pharmacist_id: string
  ward_id: string
  notes: string
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

const EMPTY_FORM: FormData = {
  medicine_id: '',
  transaction_type: '出庫',
  quantity: '',
  patient_name: '',
  date: today(),
  supplier_id: '',
  pharmacist_id: '',
  ward_id: '',
  notes: '',
}

export default function TransactionForm({ medicines, suppliers, pharmacists, wards, editingTransaction, onSuccess, onCancelEdit }: Props) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const isEditing = !!editingTransaction

  useEffect(() => {
    if (editingTransaction) {
      setForm({
        medicine_id: String(editingTransaction.medicine_id),
        transaction_type: editingTransaction.transaction_type,
        quantity: String(editingTransaction.quantity),
        patient_name: editingTransaction.patient_name || '',
        date: editingTransaction.date,
        supplier_id: editingTransaction.supplier_id ? String(editingTransaction.supplier_id) : '',
        pharmacist_id: String(editingTransaction.pharmacist_id),
        ward_id: editingTransaction.ward_id ? String(editingTransaction.ward_id) : '',
        notes: editingTransaction.notes || '',
      })
    } else {
      setForm(EMPTY_FORM)
    }
    setError('')
    setSuccess('')
  }, [editingTransaction])

  const set = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // バリデーション
    if (!form.medicine_id) { setError('医薬品名を選択してください'); return }
    if (!form.quantity || parseInt(form.quantity) <= 0) { setError('数量は1以上の整数を入力してください'); return }
    if (!form.pharmacist_id) { setError('薬剤師名を選択してください'); return }
    if (!form.date) { setError('日付を入力してください'); return }
    if (form.transaction_type === '出庫' && !form.patient_name.trim()) { setError('出庫の場合は患者氏名を入力してください'); return }
    if (form.transaction_type === '入庫' && !form.supplier_id) { setError('入庫の場合は購入先を選択してください'); return }

    setLoading(true)
    try {
      const payload = {
        medicine_id: parseInt(form.medicine_id),
        transaction_type: form.transaction_type,
        quantity: parseInt(form.quantity),
        patient_name: form.patient_name.trim() || null,
        date: form.date,
        supplier_id: form.supplier_id ? parseInt(form.supplier_id) : null,
        pharmacist_id: parseInt(form.pharmacist_id),
        ward_id: form.ward_id ? parseInt(form.ward_id) : null,
        notes: form.notes.trim() || null,
      }

      if (isEditing && editingTransaction) {
        await client.put(`/transactions/${editingTransaction.id}`, payload)
        setSuccess('受払記録を更新しました')
        onCancelEdit()
      } else {
        await client.post('/transactions', payload)
        setSuccess('受払記録を登録しました')
        setForm({ ...EMPTY_FORM, pharmacist_id: form.pharmacist_id, ward_id: form.ward_id, date: form.date })
      }
      onSuccess()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error || '登録に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    if (isEditing) {
      onCancelEdit()
    } else {
      setForm(EMPTY_FORM)
      setError('')
      setSuccess('')
    }
  }

  return (
    <div className="card max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">
          {isEditing ? '受払記録を編集' : '受払入力'}
        </h2>
        {isEditing && (
          <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-3 py-1 rounded-full">編集モード</span>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 入出庫区分 */}
        <div>
          <label className="form-label">入出庫区分 <span className="text-red-500">*</span></label>
          <div className="flex gap-3">
            {(['入庫', '出庫'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set('transaction_type', t)}
                className={`flex-1 min-h-[52px] rounded-xl font-bold text-base border-2 transition-all duration-150 ${
                  form.transaction_type === t
                    ? t === '入庫'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                      : 'bg-orange-500 border-orange-500 text-white shadow-sm'
                    : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400'
                }`}
              >
                {t === '入庫' ? '↑ 入庫' : '↓ 出庫'}
              </button>
            ))}
          </div>
        </div>

        {/* 医薬品名 */}
        <div>
          <label className="form-label">医薬品名 <span className="text-red-500">*</span></label>
          <select
            value={form.medicine_id}
            onChange={(e) => set('medicine_id', e.target.value)}
            className="form-select"
          >
            <option value="">-- 選択してください --</option>
            {medicines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}（在庫: {m.current_stock}{m.unit}）
              </option>
            ))}
          </select>
        </div>

        {/* 数量 */}
        <div>
          <label className="form-label">数量 <span className="text-red-500">*</span></label>
          <input
            type="number"
            min="1"
            value={form.quantity}
            onChange={(e) => set('quantity', e.target.value)}
            placeholder="例: 30"
            className="form-input"
          />
        </div>

        {/* 日付 */}
        <div>
          <label className="form-label">日付 <span className="text-red-500">*</span></label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
            className="form-input"
          />
        </div>

        {/* 患者氏名 */}
        <div>
          <label className="form-label">
            患者氏名（フルネーム）
            {form.transaction_type === '出庫' && <span className="text-red-500 ml-1">*</span>}
            {form.transaction_type === '入庫' && <span className="text-slate-400 text-xs ml-2">（入庫の場合は任意）</span>}
          </label>
          <input
            type="text"
            value={form.patient_name}
            onChange={(e) => set('patient_name', e.target.value)}
            placeholder="例: 山田 太郎"
            className="form-input"
          />
        </div>

        {/* 購入先 */}
        <div>
          <label className="form-label">
            購入先
            {form.transaction_type === '入庫' && <span className="text-red-500 ml-1">*</span>}
            {form.transaction_type === '出庫' && <span className="text-slate-400 text-xs ml-2">（出庫の場合は任意）</span>}
          </label>
          <select
            value={form.supplier_id}
            onChange={(e) => set('supplier_id', e.target.value)}
            className="form-select"
          >
            <option value="">-- 選択してください --</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* 薬剤師名 */}
        <div>
          <label className="form-label">薬剤師名 <span className="text-red-500">*</span></label>
          <select
            value={form.pharmacist_id}
            onChange={(e) => set('pharmacist_id', e.target.value)}
            className="form-select"
          >
            <option value="">-- 選択してください --</option>
            {pharmacists.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* 病棟 */}
        <div>
          <label className="form-label">病棟<span className="text-slate-400 text-xs ml-2">（任意）</span></label>
          <select
            value={form.ward_id}
            onChange={(e) => set('ward_id', e.target.value)}
            className="form-select"
          >
            <option value="">-- 選択してください --</option>
            {wards.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        {/* 備考 */}
        <div>
          <label className="form-label">備考</label>
          <textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="任意メモ"
            rows={2}
            className="form-input resize-none"
          />
        </div>

        {/* ボタン */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 text-lg disabled:opacity-50"
          >
            {loading ? '処理中...' : isEditing ? '更新する' : '登録する'}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="btn-secondary"
          >
            {isEditing ? 'キャンセル' : 'クリア'}
          </button>
        </div>
      </form>
    </div>
  )
}
