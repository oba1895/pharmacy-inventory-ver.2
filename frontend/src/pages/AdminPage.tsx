import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Medicine, Supplier, Pharmacist, Ward, Transaction } from '../types'
import client from '../api/client'
import InventoryTable from '../components/InventoryTable'
import TransactionForm from '../components/TransactionForm'
import TransactionHistory from '../components/TransactionHistory'
import MasterDataManager from '../components/MasterDataManager'

type Tab = 'inventory' | 'form' | 'history' | 'master'

export default function AdminPage() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('inventory')
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [pharmacists, setPharmacists] = useState<Pharmacist[]>([])
  const [wards, setWards] = useState<Ward[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingMeds, setLoadingMeds] = useState(true)
  const [loadingTxs, setLoadingTxs] = useState(true)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)

  const fetchMedicines = useCallback(async () => {
    try {
      const res = await client.get('/medicines')
      setMedicines(res.data)
    } catch {
      // エラーは無視（認証エラーはaxiosインターセプターで処理）
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

  const fetchMaster = useCallback(async () => {
    try {
      const [supRes, pharmRes, wardRes] = await Promise.all([
        client.get('/master/suppliers'),
        client.get('/master/pharmacists'),
        client.get('/master/wards'),
      ])
      setSuppliers(supRes.data)
      setPharmacists(pharmRes.data)
      setWards(wardRes.data)
    } catch {
      // ignore
    }
  }, [])

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchMedicines(), fetchTransactions(), fetchMaster()])
  }, [fetchMedicines, fetchTransactions, fetchMaster])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const handleTxSuccess = () => {
    fetchMedicines()
    fetchTransactions()
  }

  const handleDelete = async (tx: Transaction) => {
    try {
      await client.delete(`/transactions/${tx.id}`)
      fetchMedicines()
      fetchTransactions()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      alert(e.response?.data?.error || '削除に失敗しました')
    }
  }

  const handleEdit = (tx: Transaction) => {
    setEditingTx(tx)
    setActiveTab('form')
  }

  const handleCancelEdit = () => {
    setEditingTx(null)
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'inventory', label: '在庫一覧', icon: '📦' },
    { key: 'form', label: '受払入力', icon: '✏️' },
    { key: 'history', label: '受払履歴', icon: '📋' },
    { key: 'master', label: 'マスタ管理', icon: '⚙️' },
  ]

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* ヘッダー */}
      <header className="bg-blue-800 text-white shadow-lg flex-shrink-0">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💊</span>
            <div>
              <h1 className="text-base font-bold leading-tight">在庫管理システム</h1>
              <p className="text-blue-200 text-xs">管理者モード</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold">{user?.displayName}</p>
              <p className="text-blue-200 text-xs">管理者</p>
            </div>
            <button onClick={logout} className="btn btn-secondary btn-sm text-sm">
              ログアウト
            </button>
          </div>
        </div>

        {/* タブバー */}
        <div className="flex border-t border-blue-700/50">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key)
                if (tab.key !== 'form') setEditingTx(null)
              }}
              className={`flex-1 py-3 text-center text-xs font-semibold transition-colors duration-150 border-b-2 ${
                activeTab === tab.key
                  ? 'text-white border-white bg-white/10'
                  : 'text-blue-200 border-transparent hover:text-white hover:bg-white/5'
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
          {activeTab === 'inventory' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-700">現在の在庫状況</h2>
                <button onClick={fetchMedicines} className="btn-secondary btn-sm text-xs">
                  更新
                </button>
              </div>
              <InventoryTable medicines={medicines} loading={loadingMeds} />
            </div>
          )}

          {activeTab === 'form' && (
            <TransactionForm
              medicines={medicines}
              suppliers={suppliers}
              pharmacists={pharmacists}
              wards={wards}
              editingTransaction={editingTx}
              onSuccess={handleTxSuccess}
              onCancelEdit={handleCancelEdit}
            />
          )}

          {activeTab === 'history' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-700">受払履歴</h2>
                <button onClick={fetchTransactions} className="btn-secondary btn-sm text-xs">
                  更新
                </button>
              </div>
              <TransactionHistory
                transactions={transactions}
                loading={loadingTxs}
                isAdmin={true}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          )}

          {activeTab === 'master' && (
            <div>
              <h2 className="text-lg font-bold text-slate-700 mb-4">マスタデータ管理</h2>
              <MasterDataManager
                medicines={medicines}
                suppliers={suppliers}
                pharmacists={pharmacists}
                wards={wards}
                onRefresh={fetchAll}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
