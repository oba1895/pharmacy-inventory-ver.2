import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Medicine, Transaction } from '../types'
import client from '../api/client'
import InventoryTable from '../components/InventoryTable'
import TransactionHistory from '../components/TransactionHistory'

type Tab = 'inventory' | 'history'

const POLL_INTERVAL_MS = 30_000 // 30秒ごとに自動更新

export default function ViewerPage() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('inventory')
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingMeds, setLoadingMeds] = useState(true)
  const [loadingTxs, setLoadingTxs] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchMedicines = useCallback(async () => {
    try {
      const res = await client.get('/medicines')
      setMedicines(res.data)
      setLastUpdated(new Date())
    } catch {
      // ignore
    } finally {
      setLoadingMeds(false)
    }
  }, [])

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await client.get('/transactions')
      setTransactions(res.data)
    } catch {
      // ignore
    } finally {
      setLoadingTxs(false)
    }
  }, [])

  useEffect(() => {
    fetchMedicines()
    fetchTransactions()

    // 定期ポーリング（30秒）
    const interval = setInterval(() => {
      fetchMedicines()
      fetchTransactions()
    }, POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [fetchMedicines, fetchTransactions])

  const formatTime = (d: Date) => {
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'inventory', label: '在庫一覧', icon: '📦' },
    { key: 'history', label: '受払履歴', icon: '📋' },
  ]

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* ヘッダー */}
      <header className="bg-slate-700 text-white shadow-lg flex-shrink-0">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💊</span>
            <div>
              <h1 className="text-base font-bold leading-tight">在庫管理システム</h1>
              <p className="text-slate-300 text-xs">
                {lastUpdated ? `最終更新: ${formatTime(lastUpdated)}` : '読み込み中...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold">{user?.displayName}</p>
              <p className="text-slate-300 text-xs">閲覧モード</p>
            </div>
            <button onClick={logout} className="btn btn-secondary btn-sm text-sm">
              ログアウト
            </button>
          </div>
        </div>

        {/* タブバー */}
        <div className="flex border-t border-slate-600/50">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-center text-xs font-semibold transition-colors duration-150 border-b-2 ${
                activeTab === tab.key
                  ? 'text-white border-white bg-white/10'
                  : 'text-slate-300 border-transparent hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="block text-base leading-tight">{tab.icon}</span>
              <span className="block">{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* コンテンツ */}
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-6">
          {/* 閲覧専用バナー */}
          <div className="mb-4 flex items-center gap-2 text-sm text-slate-500 bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>閲覧専用モード — データは30秒ごとに自動更新されます</span>
            <button
              onClick={() => { fetchMedicines(); fetchTransactions() }}
              className="ml-auto text-blue-600 font-semibold hover:text-blue-800 text-xs"
            >
              今すぐ更新
            </button>
          </div>

          {activeTab === 'inventory' && (
            <div>
              <h2 className="text-lg font-bold text-slate-700 mb-4">現在の在庫状況</h2>
              <InventoryTable medicines={medicines} loading={loadingMeds} />
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h2 className="text-lg font-bold text-slate-700 mb-4">受払履歴</h2>
              <TransactionHistory
                transactions={transactions}
                loading={loadingTxs}
                isAdmin={false}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
