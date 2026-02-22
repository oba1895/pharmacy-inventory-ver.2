import React, { useState, useMemo } from 'react'
import { Transaction } from '../types'

interface Props {
  transactions: Transaction[]
  loading: boolean
  isAdmin: boolean
  onEdit?: (tx: Transaction) => void
  onDelete?: (tx: Transaction) => void
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${y}年${parseInt(m)}月${parseInt(d)}日`
}

export default function TransactionHistory({ transactions, loading, isAdmin, onEdit, onDelete }: Props) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [filterType, setFilterType] = useState<'全て' | '入庫' | '出庫'>('全て')
  const [filterMedicine, setFilterMedicine] = useState('')
  const [filterPatient, setFilterPatient] = useState('')
  const [filterWard, setFilterWard] = useState('')

  const medicineNames = useMemo(() => {
    const names = [...new Set(transactions.map((t) => t.medicine_name))].sort()
    return names
  }, [transactions])

  const wardNames = useMemo(() => {
    const names = [...new Set(transactions.filter((t) => t.ward_name).map((t) => t.ward_name as string))].sort()
    return names
  }, [transactions])

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (filterType !== '全て' && tx.transaction_type !== filterType) return false
      if (filterMedicine && tx.medicine_id !== parseInt(filterMedicine)) return false
      if (filterPatient && !tx.patient_name?.includes(filterPatient)) return false
      if (filterWard && tx.ward_name !== filterWard) return false
      return true
    })
  }, [transactions, filterType, filterMedicine, filterPatient, filterWard])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <>
      {/* フィルタバー */}
      <div className="card mb-4 p-4">
        <div className="flex flex-wrap gap-3 items-end">
          {/* 種別フィルタ */}
          <div className="flex gap-2">
            {(['全て', '入庫', '出庫'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`btn btn-sm text-sm ${
                  filterType === t ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* 医薬品フィルタ */}
          <div className="flex-1 min-w-[160px]">
            <select
              value={filterMedicine}
              onChange={(e) => setFilterMedicine(e.target.value)}
              className="form-select py-2 text-sm"
            >
              <option value="">医薬品: 全て</option>
              {medicineNames.map((name) => {
                const tx = transactions.find((t) => t.medicine_name === name)
                return (
                  <option key={name} value={tx?.medicine_id ?? ''}>
                    {name}
                  </option>
                )
              })}
            </select>
          </div>

          {/* 患者名フィルタ */}
          <div className="flex-1 min-w-[140px]">
            <input
              type="text"
              value={filterPatient}
              onChange={(e) => setFilterPatient(e.target.value)}
              placeholder="患者名で検索"
              className="form-input py-2 text-sm"
            />
          </div>

          {/* 病棟フィルタ */}
          {wardNames.length > 0 && (
            <div className="flex-1 min-w-[140px]">
              <select
                value={filterWard}
                onChange={(e) => setFilterWard(e.target.value)}
                className="form-select py-2 text-sm"
              >
                <option value="">病棟: 全て</option>
                {wardNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          )}

          {/* リセット */}
          {(filterType !== '全て' || filterMedicine || filterPatient || filterWard) && (
            <button
              onClick={() => { setFilterType('全て'); setFilterMedicine(''); setFilterPatient(''); setFilterWard('') }}
              className="btn btn-secondary btn-sm text-sm"
            >
              リセット
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-slate-400 py-16 text-lg">
          {transactions.length === 0 ? '受払履歴がありません' : '条件に一致する記録がありません'}
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-4 text-slate-600 font-semibold whitespace-nowrap">日付</th>
                  <th className="text-left px-4 py-4 text-slate-600 font-semibold whitespace-nowrap">医薬品名</th>
                  <th className="text-center px-4 py-4 text-slate-600 font-semibold whitespace-nowrap">区分</th>
                  <th className="text-right px-4 py-4 text-slate-600 font-semibold whitespace-nowrap">数量</th>
                  <th className="text-left px-4 py-4 text-slate-600 font-semibold whitespace-nowrap">患者氏名</th>
                  <th className="text-left px-4 py-4 text-slate-600 font-semibold whitespace-nowrap hidden lg:table-cell">購入先</th>
                  <th className="text-left px-4 py-4 text-slate-600 font-semibold whitespace-nowrap hidden md:table-cell">病棟</th>
                  <th className="text-left px-4 py-4 text-slate-600 font-semibold whitespace-nowrap hidden md:table-cell">薬剤師</th>
                  {isAdmin && <th className="text-center px-4 py-4 text-slate-600 font-semibold whitespace-nowrap">操作</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-xs">{formatDate(tx.date)}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{tx.medicine_name}</td>
                    <td className="px-4 py-3 text-center">
                      {tx.transaction_type === '入庫'
                        ? <span className="badge-in">↑ 入庫</span>
                        : <span className="badge-out">↓ 出庫</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">
                      {tx.transaction_type === '入庫' ? '+' : '-'}{tx.quantity}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {tx.patient_name || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">
                      {tx.supplier_name || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden md:table-cell whitespace-nowrap">
                      {tx.ward_name || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden md:table-cell whitespace-nowrap">{tx.pharmacist_name}</td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => onEdit?.(tx)} className="btn btn-secondary btn-sm text-xs">編集</button>
                          <button onClick={() => setConfirmDeleteId(tx.id)} className="btn btn-danger btn-sm text-xs">削除</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 text-right">
            {filtered.length} 件 {filtered.length !== transactions.length && `（全 ${transactions.length} 件中）`}
          </div>
        </div>
      )}

      {/* 削除確認モーダル */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50" onClick={() => setConfirmDeleteId(null)}>
          <div className="bg-white rounded-2xl p-7 w-80 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">この記録を削除しますか？</h3>
              <p className="text-sm text-slate-500">削除すると在庫数も自動的に更新されます。<br/>この操作は取り消せません。</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteId(null)} className="btn-secondary flex-1">キャンセル</button>
              <button
                onClick={() => {
                  const tx = filtered.find((t) => t.id === confirmDeleteId)
                  if (tx) onDelete?.(tx)
                  setConfirmDeleteId(null)
                }}
                className="btn-danger flex-1"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
