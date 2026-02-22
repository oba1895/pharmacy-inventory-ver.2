import React from 'react'
import { Medicine } from '../types'

interface Props {
  medicines: Medicine[]
  loading: boolean
}

function stockColor(stock: number): string {
  if (stock === 0) return 'bg-red-50 text-red-700 font-bold'
  if (stock <= 10) return 'bg-amber-50 text-amber-700 font-semibold'
  return 'text-slate-800'
}

function stockBadge(stock: number) {
  if (stock === 0) return <span className="ml-2 text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">在庫切れ</span>
  if (stock <= 10) return <span className="ml-2 text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">在庫少</span>
  return null
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

export default function InventoryTable({ medicines, loading }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (medicines.length === 0) {
    return (
      <div className="text-center text-slate-400 py-16 text-lg">
        医薬品データがありません
      </div>
    )
  }

  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-5 py-4 text-slate-600 font-semibold text-sm w-1/2">医薬品名</th>
              <th className="text-right px-5 py-4 text-slate-600 font-semibold text-sm">現在庫数</th>
              <th className="text-center px-5 py-4 text-slate-600 font-semibold text-sm">単位</th>
              <th className="text-right px-5 py-4 text-slate-600 font-semibold text-sm hidden md:table-cell">最終更新</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {medicines.map((m) => (
              <tr
                key={m.id}
                className={`transition-colors hover:bg-slate-50 ${m.current_stock === 0 ? 'bg-red-50/50' : ''}`}
              >
                <td className="px-5 py-4">
                  <div className="flex items-center flex-wrap gap-1">
                    <span className="font-medium text-slate-800">{m.name}</span>
                    {stockBadge(m.current_stock)}
                  </div>
                </td>
                <td className={`px-5 py-4 text-right text-2xl font-bold ${stockColor(m.current_stock)}`}>
                  {m.current_stock.toLocaleString()}
                </td>
                <td className="px-5 py-4 text-center text-slate-500">{m.unit}</td>
                <td className="px-5 py-4 text-right text-slate-400 text-xs hidden md:table-cell">
                  {formatDate(m.updated_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 text-right">
        {medicines.length} 品目
      </div>
    </div>
  )
}
