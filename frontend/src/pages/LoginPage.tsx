import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import client from '../api/client'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username || !password) { setError('ユーザー名とパスワードを入力してください'); return }
    setLoading(true)
    try {
      const res = await client.post('/auth/login', { username, password })
      login(res.data.token, res.data.user)
      navigate(res.data.user.role === 'admin' ? '/admin' : '/viewer', { replace: true })
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error || 'ログインに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex flex-col items-center justify-center px-6">
      {/* ロゴ/タイトル */}
      <div className="text-center mb-10">
        <div className="text-6xl mb-4">💊</div>
        <h1 className="text-3xl font-bold text-white mb-2">臨時購入医薬品</h1>
        <p className="text-blue-200 text-lg">在庫管理システム</p>
      </div>

      {/* ログインカード */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8">
        <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">ログイン</h2>

        {error && (
          <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="form-label">ユーザー名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError('') }}
              placeholder="例: admin"
              autoCapitalize="none"
              autoCorrect="off"
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              placeholder="パスワード"
              className="form-input"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-lg mt-2 disabled:opacity-60"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        {/* テスト用アカウント情報 */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-xs text-slate-400 text-center font-semibold mb-3">テスト用アカウント</p>
          <div className="space-y-2">
            <div className="flex justify-between text-xs bg-slate-50 rounded-lg px-3 py-2">
              <span className="text-slate-500">管理者（調剤室用）</span>
              <span className="font-mono text-slate-700">admin / admin123</span>
            </div>
            <div className="flex justify-between text-xs bg-slate-50 rounded-lg px-3 py-2">
              <span className="text-slate-500">閲覧者（モニター用）</span>
              <span className="font-mono text-slate-700">staff / staff123</span>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-8 text-blue-300/60 text-xs text-center">
        © 臨時購入医薬品在庫管理システム
      </p>
    </div>
  )
}
