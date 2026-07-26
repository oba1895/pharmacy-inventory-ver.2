import { useMemo, useState } from 'react'
import { Medicine, Transaction } from '../types'

interface Props {
  medicines: Medicine[]
  transactions: Transaction[]
  loading: boolean
}

interface ExpiryInfo {
  medicine: Medicine
  expiry_date: string | null
  daysUntilExpiry: number | null
}

type SortKey = 'status' | 'expiry_date' | 'name'

function getStatus(daysUntilExpiry: number | null): 'expired' | 'warning' | 'ok' | 'unknown' {
  if (daysUntilExpiry === null) return 'unknown'
  if (daysUntilExpiry < 0) return 'expired'
  if (daysUntilExpiry <= 90) return 'warning'
  return 'ok'
}

function formatExpiry(expiry_date: string): string {
  const [year, month] = expiry_date.split('-')
  return `${year}年${month}月`
}

function calcDaysUntilExpiry(expiry_date: string): number {
  const [year, month] = expiry_date.split('-').map(Number)
  const lastDay = new Date(year, month, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.floor((lastDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

const statusConfig = {
  expired: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700', label: '期限切れ', icon: '🔴', printLabel: '期限切れ' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', label: '期限間近', icon: '🟡', printLabel: '期限間近' },
  ok:      { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', label: '余裕あり', icon: '🟢', printLabel: '余裕あり' },
  unknown: { bg: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-500', label: '未登録', icon: '⚪', printLabel: '未登録' },
}

export default function ExpiryTab({ medicines, transactions, loading }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('status')

  const expiryList: ExpiryInfo[] = useMemo(() => {
    return medicines.filter((med) => med.current_stock > 0).map((med) => {
      const inbound = transactions
        .filter((t) => t.medicine_id === med.id && t.transaction_type === '入庫' && t.expiry_date)
        .sort((a, b) => b.date.localeCompare(a.date))

      const latestExpiry = inbound[0]?.expiry_date ?? null
      const daysUntilExpiry = latestExpiry ? calcDaysUntilExpiry(latestExpiry) : null

      return { medicine: med, expiry_date: latestExpiry, daysUntilExpiry }
    })
  }, [medicines, transactions])

  const sortedList = useMemo(() => {
    return [...expiryList].sort((a, b) => {
      if (sortKey === 'status') {
        const order = { expired: 0, warning: 1, ok: 2, unknown: 3 }
        const diff = order[getStatus(a.daysUntilExpiry)] - order[getStatus(b.daysUntilExpiry)]
        if (diff !== 0) return diff
        // 同じステータスなら日付順
        return (a.expiry_date ?? '9999-99').localeCompare(b.expiry_date ?? '9999-99')
      }
      if (sortKey === 'expiry_date') {
        return (a.expiry_date ?? '9999-99').localeCompare(b.expiry_date ?? '9999-99')
      }
      // name
      return a.medicine.name.localeCompare(b.medicine.name, 'ja')
    })
  }, [expiryList, sortKey])

  const summary = {
    expired: expiryList.filter((e) => getStatus(e.daysUntilExpiry) === 'expired').length,
    warning: expiryList.filter((e) => getStatus(e.daysUntilExpiry) === 'warning').length,
    ok:      expiryList.filter((e) => getStatus(e.daysUntilExpiry) === 'ok').length,
    unknown: expiryList.filter((e) => getStatus(e.daysUntilExpiry) === 'unknown').length,
  }

  const printedAt = new Date().toLocaleString('ja-JP')

  if (loading) {
    return <p className="text-center text-slate-400 py-10">読み込み中...</p>
  }

  return (
    <>
      {/* 印刷用スタイル */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #expiry-print-area, #expiry-print-area * { visibility: visible; }
          #expiry-print-area { position: fixed; top: 0; left: 0; width: 100%; padding: 16px; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div>
        {/* ヘッダー行 */}
        <div className="flex items-center justify-between mb-4 no-print">
          <h2 className="text-lg font-bold text-slate-700">使用期限管理</h2>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            🖨️ 印刷
          </button>
        </div>

        {/* サマリーバッジ */}
        <div className="flex flex-wrap gap-3 mb-4 no-print">
          {summary.expired > 0 && (
            <div className="flex items-center gap-2 bg-red-100 text-red-700 font-semibold px-4 py-2 rounded-xl text-sm">
              🔴 期限切れ: {summary.expired}件
            </div>
          )}
          {summary.warning > 0 && (
            <div className="flex items-center gap-2 bg-amber-100 text-amber-700 font-semibold px-4 py-2 rounded-xl text-sm">
              🟡 期限間近（90日以内）: {summary.warning}件
            </div>
          )}
          {summary.ok > 0 && (
            <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 font-semibold px-4 py-2 rounded-xl text-sm">
              🟢 余裕あり: {summary.ok}件
            </div>
          )}
          {summary.unknown > 0 && (
            <div className="flex items-center gap-2 bg-slate-100 text-slate-500 font-semibold px-4 py-2 rounded-xl text-sm">
              ⚪ 未登録: {summary.unknown}件
            </div>
          )}
        </div>

        {/* ソートコントロール */}
        <div className="flex items-center gap-2 mb-4 no-print">
          <span className="text-sm text-slate-500 font-medium">並び替え:</span>
          {([
            { key: 'status', label: 'ステータス順' },
            { key: 'expiry_date', label: '期限が近い順' },
            { key: 'name', label: '医薬品名順' },
          ] as { key: SortKey; label: string }[]).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortKey(opt.key)}
              className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
                sortKey === opt.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-300 text-slate-600 hover:border-blue-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* 印刷エリア */}
        <div id="expiry-print-area">
          {/* 印刷時のみ表示するヘッダー */}
          <div className="hidden print:block mb-4">
            <h1 className="text-xl font-bold">使用期限管理一覧</h1>
            <p className="text-sm text-gray-500">印刷日時: {printedAt}</p>
          </div>

          {/* 一覧 */}
          <div className="space-y-3">
            {sortedList.map(({ medicine, expiry_date, daysUntilExpiry }) => {
              const status = getStatus(daysUntilExpiry)
              const cfg = statusConfig[status]
              return (
                <div
                  key={medicine.id}
                  className={`rounded-xl border p-4 flex items-center justify-between gap-4 ${cfg.bg} ${cfg.border}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{medicine.name}</p>
                    <p className="text-sm text-slate-500 mt-0.5">在庫: {medicine.current_stock}{medicine.unit}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {expiry_date ? (
                      <>
                        <p className="font-bold text-slate-700">{formatExpiry(expiry_date)}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {daysUntilExpiry !== null && daysUntilExpiry < 0
                            ? `${Math.abs(daysUntilExpiry)}日超過`
                            : `あと${daysUntilExpiry}日`}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-slate-400">使用期限未登録</p>
                    )}
                    <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          <p className="mt-4 text-xs text-slate-400 text-center">
            ※ 使用期限は入庫記録の最新値を表示しています
          </p>
        </div>
      </div>
    </>
  )
}
