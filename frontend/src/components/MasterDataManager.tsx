import React, { useState } from 'react'
import { Medicine, Supplier, Pharmacist, Ward } from '../types'
import client from '../api/client'
import BulkImport from './BulkImport'

interface Props {
  medicines: Medicine[]
  suppliers: Supplier[]
  pharmacists: Pharmacist[]
  wards: Ward[]
  onRefresh: () => void
}

type Section = 'medicines' | 'suppliers' | 'pharmacists' | 'wards'

export default function MasterDataManager({ medicines, suppliers, pharmacists, wards, onRefresh }: Props) {
  const [section, setSection] = useState<Section>('medicines')
  const [newMedName, setNewMedName] = useState('')
  const [newMedUnit, setNewMedUnit] = useState('錠')
  const [newSupName, setNewSupName] = useState('')
  const [newPharmName, setNewPharmName] = useState('')
  const [newWardName, setNewWardName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAdd = async (type: Section) => {
    setError('')
    setLoading(true)
    try {
      if (type === 'medicines') {
        if (!newMedName.trim()) { setError('医薬品名を入力してください'); return }
        await client.post('/medicines', { name: newMedName.trim(), unit: newMedUnit.trim() || '錠' })
        setNewMedName('')
        setNewMedUnit('錠')
      } else if (type === 'suppliers') {
        if (!newSupName.trim()) { setError('購入先名を入力してください'); return }
        await client.post('/master/suppliers', { name: newSupName.trim() })
        setNewSupName('')
      } else if (type === 'pharmacists') {
        if (!newPharmName.trim()) { setError('薬剤師名を入力してください'); return }
        await client.post('/master/pharmacists', { name: newPharmName.trim() })
        setNewPharmName('')
      } else {
        if (!newWardName.trim()) { setError('病棟名を入力してください'); return }
        await client.post('/master/wards', { name: newWardName.trim() })
        setNewWardName('')
      }
      onRefresh()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error || '追加に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (type: Section, id: number) => {
    setError('')
    setLoading(true)
    try {
      if (type === 'medicines') await client.delete(`/medicines/${id}`)
      else if (type === 'suppliers') await client.delete(`/master/suppliers/${id}`)
      else if (type === 'pharmacists') await client.delete(`/master/pharmacists/${id}`)
      else await client.delete(`/master/wards/${id}`)
      onRefresh()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error || '削除に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const sections: { key: Section; label: string }[] = [
    { key: 'medicines', label: '医薬品' },
    { key: 'suppliers', label: '購入先' },
    { key: 'pharmacists', label: '薬剤師' },
    { key: 'wards', label: '病棟' },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* セクション切替 */}
      <div className="flex gap-2">
        {sections.map((s) => (
          <button
            key={s.key}
            onClick={() => { setSection(s.key); setError('') }}
            className={`btn btn-sm flex-1 ${section === s.key ? 'btn-primary' : 'btn-secondary'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
      )}

      {/* 医薬品マスタ */}
      {section === 'medicines' && (
        <div className="card space-y-4">
          <h3 className="font-bold text-slate-700 text-lg">医薬品マスタ</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newMedName}
              onChange={(e) => setNewMedName(e.target.value)}
              placeholder="医薬品名"
              className="form-input flex-1"
            />
            <input
              type="text"
              value={newMedUnit}
              onChange={(e) => setNewMedUnit(e.target.value)}
              placeholder="単位"
              className="form-input w-20"
            />
            <button onClick={() => handleAdd('medicines')} disabled={loading} className="btn-success btn-sm whitespace-nowrap">
              追加
            </button>
          </div>
          <BulkImport endpoint="/medicines/bulk" hasUnit nameLabel="医薬品名" templateName="医薬品" onDone={onRefresh} />
          <div className="divide-y divide-slate-100">
            {medicines.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-3 gap-3">
                <div>
                  <span className="font-medium text-slate-800">{m.name}</span>
                  <span className="ml-2 text-xs text-slate-400">{m.unit}</span>
                  <span className="ml-2 text-xs text-blue-600">在庫: {m.current_stock}</span>
                </div>
                <button
                  onClick={() => handleDelete('medicines', m.id)}
                  disabled={loading}
                  className="btn btn-danger btn-sm text-xs"
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 購入先マスタ */}
      {section === 'suppliers' && (
        <div className="card space-y-4">
          <h3 className="font-bold text-slate-700 text-lg">購入先マスタ</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newSupName}
              onChange={(e) => setNewSupName(e.target.value)}
              placeholder="購入先名"
              className="form-input flex-1"
            />
            <button onClick={() => handleAdd('suppliers')} disabled={loading} className="btn-success btn-sm whitespace-nowrap">
              追加
            </button>
          </div>
          <BulkImport endpoint="/master/suppliers/bulk" nameLabel="購入先名" templateName="購入先" onDone={onRefresh} />
          <div className="divide-y divide-slate-100">
            {suppliers.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-3">
                <span className="font-medium text-slate-800">{s.name}</span>
                <button onClick={() => handleDelete('suppliers', s.id)} disabled={loading} className="btn btn-danger btn-sm text-xs">削除</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 薬剤師マスタ */}
      {section === 'pharmacists' && (
        <div className="card space-y-4">
          <h3 className="font-bold text-slate-700 text-lg">薬剤師マスタ</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newPharmName}
              onChange={(e) => setNewPharmName(e.target.value)}
              placeholder="薬剤師名"
              className="form-input flex-1"
            />
            <button onClick={() => handleAdd('pharmacists')} disabled={loading} className="btn-success btn-sm whitespace-nowrap">
              追加
            </button>
          </div>
          <BulkImport endpoint="/master/pharmacists/bulk" nameLabel="薬剤師名" templateName="薬剤師" onDone={onRefresh} />
          <div className="divide-y divide-slate-100">
            {pharmacists.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3">
                <span className="font-medium text-slate-800">{p.name}</span>
                <button onClick={() => handleDelete('pharmacists', p.id)} disabled={loading} className="btn btn-danger btn-sm text-xs">削除</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 病棟マスタ */}
      {section === 'wards' && (
        <div className="card space-y-4">
          <h3 className="font-bold text-slate-700 text-lg">病棟マスタ</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newWardName}
              onChange={(e) => setNewWardName(e.target.value)}
              placeholder="病棟名（例: 3東病棟）"
              className="form-input flex-1"
            />
            <button onClick={() => handleAdd('wards')} disabled={loading} className="btn-success btn-sm whitespace-nowrap">
              追加
            </button>
          </div>
          <BulkImport endpoint="/master/wards/bulk" nameLabel="病棟名" templateName="病棟" onDone={onRefresh} />
          <div className="divide-y divide-slate-100">
            {wards.length === 0 && (
              <p className="text-slate-400 text-sm py-4 text-center">病棟が登録されていません</p>
            )}
            {wards.map((w) => (
              <div key={w.id} className="flex items-center justify-between py-3">
                <span className="font-medium text-slate-800">{w.name}</span>
                <button onClick={() => handleDelete('wards', w.id)} disabled={loading} className="btn btn-danger btn-sm text-xs">削除</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
