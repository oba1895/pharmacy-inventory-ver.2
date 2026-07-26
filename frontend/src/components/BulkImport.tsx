import React, { useRef, useState } from 'react'
import client from '../api/client'

interface ParsedRow {
  name: string
  unit?: string
}

interface Props {
  // 追加先のAPIパス（例: '/medicines/bulk'）
  endpoint: string
  // 単位列を持つか（医薬品のみ true）
  hasUnit?: boolean
  // 名前列の見出し（例: '医薬品名'）
  nameLabel: string
  // テンプレートファイル名（拡張子なし）
  templateName: string
  onDone: () => void
}

interface BulkResult {
  added: number
  skipped: number
  errors: string[]
}

// 見出し行かどうかを判定するための別名リスト
const NAME_ALIASES = ['名前', '名称', '医薬品名', '薬品名', '品名', '購入先', '購入先名', '業者', '卸', '薬剤師', '薬剤師名', '氏名', '病棟', '病棟名', 'name']
const UNIT_ALIASES = ['単位', 'unit']

function looksLikeHeader(row: unknown[]): boolean {
  return row.some((cell) => {
    const v = String(cell ?? '').trim().toLowerCase()
    return NAME_ALIASES.some((a) => a.toLowerCase() === v) || UNIT_ALIASES.some((a) => a.toLowerCase() === v)
  })
}

export default function BulkImport({ endpoint, hasUnit, nameLabel, templateName, onDone }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState<BulkResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const reset = () => {
    setRows([])
    setFileName('')
    setError('')
    setResult(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const parseFile = async (file: File) => {
    setError('')
    setResult(null)
    try {
      const XLSX = await import('xlsx')
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      if (!sheet) { setError('シートが見つかりませんでした'); return }
      const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false, defval: '' })
      if (matrix.length === 0) { setError('データが空です'); return }

      const startIdx = looksLikeHeader(matrix[0]) ? 1 : 0
      const parsed: ParsedRow[] = []
      for (let i = startIdx; i < matrix.length; i++) {
        const cols = matrix[i]
        const name = String(cols[0] ?? '').trim()
        if (!name) continue
        const row: ParsedRow = { name }
        if (hasUnit) row.unit = String(cols[1] ?? '').trim() || '錠'
        parsed.push(row)
      }
      if (parsed.length === 0) { setError('取り込める行がありませんでした（1列目に名前を入れてください）'); return }
      setRows(parsed)
      setFileName(file.name)
    } catch {
      setError('ファイルの読み込みに失敗しました。Excel(.xlsx)またはCSVを選んでください')
    }
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) parseFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) parseFile(file)
  }

  const handleUpload = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await client.post<BulkResult>(endpoint, { items: rows })
      setResult(res.data)
      setRows([])
      setFileName('')
      if (fileRef.current) fileRef.current.value = ''
      onDone()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error || '一括追加に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = async () => {
    const XLSX = await import('xlsx')
    const header = hasUnit ? [[nameLabel, '単位']] : [[nameLabel]]
    const sample = hasUnit
      ? [['（例）アムロジピン5mg', '錠']]
      : [['（例）サンプル']]
    const ws = XLSX.utils.aoa_to_sheet([...header, ...sample])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'template')
    XLSX.writeFile(wb, `${templateName}_テンプレート.xlsx`)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-bold text-slate-600 text-sm">📊 Excel / CSV で一括追加</h4>
        <button onClick={downloadTemplate} className="text-xs text-blue-600 hover:underline whitespace-nowrap">
          テンプレートをダウンロード
        </button>
      </div>

      {/* ドロップ / ファイル選択エリア */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-5 text-center text-sm transition-colors ${
          dragOver ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-slate-300 text-slate-500 hover:border-blue-300'
        }`}
      >
        ファイルをここにドラッグ、またはクリックして選択
        <br />
        <span className="text-xs text-slate-400">対応形式: .xlsx / .xls / .csv（1列目に{nameLabel}{hasUnit ? '、2列目に単位' : ''}）</span>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFile}
        className="hidden"
      />

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">{error}</div>
      )}

      {/* プレビュー */}
      {rows.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-slate-600">
            <span className="font-bold text-slate-800">{fileName}</span> から <span className="font-bold text-blue-600">{rows.length}件</span> を読み込みました
          </p>
          <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white divide-y divide-slate-100 text-sm">
            {rows.slice(0, 50).map((r, i) => (
              <div key={i} className="flex justify-between px-3 py-1.5">
                <span className="text-slate-800">{r.name}</span>
                {hasUnit && <span className="text-xs text-slate-400">{r.unit}</span>}
              </div>
            ))}
            {rows.length > 50 && (
              <div className="px-3 py-1.5 text-xs text-slate-400 text-center">…ほか {rows.length - 50}件</div>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={handleUpload} disabled={loading} className="btn-success btn-sm flex-1">
              {loading ? '追加中…' : `${rows.length}件を追加する`}
            </button>
            <button onClick={reset} disabled={loading} className="btn btn-secondary btn-sm">
              クリア
            </button>
          </div>
        </div>
      )}

      {/* 結果 */}
      {result && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm space-y-1">
          <p className="text-emerald-800 font-medium">
            ✅ {result.added}件を追加しました
            {result.skipped > 0 && <span className="text-slate-500 font-normal">（重複などで {result.skipped}件スキップ）</span>}
          </p>
          {result.errors.length > 0 && (
            <ul className="text-xs text-amber-700 list-disc list-inside">
              {result.errors.slice(0, 10).map((msg, i) => <li key={i}>{msg}</li>)}
              {result.errors.length > 10 && <li>…ほか {result.errors.length - 10}件</li>}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
