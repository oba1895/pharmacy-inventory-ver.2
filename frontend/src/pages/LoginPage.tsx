import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: '' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'ログイン失敗')
      login(data.token, data.user)
      navigate('/admin', { replace: true })
    } catch (e) {
      setError('ログインに失敗しました: ' + (e instanceof Error ? e.message : ''))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex flex-col items-center justify-center px-6">
      <div className="text-center mb-10">
        <div className="text-6xl mb-4">💊</div>
        <h1 className="text-3xl font-bold text-white mb-2">臨時購入医薬品</h1>
        <p className="text-blue-200 text-lg">在庫管理システム</p>
      </div>

      <div className="w-full max-w-xs bg-white rounded-3xl shadow-2xl p-8">
        <h2 className="text-xl font-bold text-slate-800 mb-2 text-center">管理者ログイン</h2>
        <p className="text-sm text-slate-400 text-center mb-6">ボタンを押してログインしてください</p>

        {error && (
          <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-primary w-full text-lg disabled:opacity-60"
        >
          {loading ? 'ログイン中...' : 'ログイン'}
        </button>

        <button
          onClick={() => navigate('/viewer')}
          className="mt-6 w-full text-sm text-slate-400 hover:text-slate-600 text-center"
        >
          ← 閲覧画面に戻る
        </button>
      </div>

      <p className="mt-8 text-blue-300/60 text-xs text-center">
        © 臨時購入医薬品在庫管理システム
      </p>
    </div>
  )
}
