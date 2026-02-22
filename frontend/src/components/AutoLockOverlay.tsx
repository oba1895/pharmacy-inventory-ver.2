import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import client from '../api/client'

interface Props {
  onUnlock: () => void
}

export default function AutoLockOverlay({ onUnlock }: Props) {
  const { user, login, logout } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showInput, setShowInput] = useState(false)

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const res = await client.post('/auth/login', { username: user.username, password })
      login(res.data.token, res.data.user)
      setPassword('')
      onUnlock()
    } catch {
      setError('パスワードが違います')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', background: 'rgba(15, 23, 42, 0.7)' }}
    >
      <div className="w-full max-w-sm mx-6 text-center">
        {/* ロックアイコン */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>

        <p className="text-white text-2xl font-bold mb-2">画面がロックされています</p>
        <p className="text-white/70 text-sm mb-8">5分間操作がありませんでした</p>
        <p className="text-white/80 text-sm mb-8">
          ログイン中: <span className="font-semibold">{user?.displayName}</span>
        </p>

        {!showInput ? (
          <button
            onClick={() => setShowInput(true)}
            className="btn-primary w-full text-lg py-4 rounded-2xl"
          >
            ロックを解除する
          </button>
        ) : (
          <form onSubmit={handleUnlock} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードを入力"
              autoFocus
              className="w-full min-h-[56px] px-5 py-4 rounded-2xl text-base bg-white/10 text-white placeholder-white/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400 text-center text-lg tracking-widest"
            />
            {error && (
              <p className="text-red-400 text-sm font-medium">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !password}
              className="btn-primary w-full text-lg py-4 rounded-2xl disabled:opacity-50"
            >
              {loading ? '確認中...' : '解除'}
            </button>
          </form>
        )}

        <button
          onClick={logout}
          className="mt-6 text-white/50 text-sm hover:text-white/80 transition-colors"
        >
          ログアウト
        </button>
      </div>
    </div>
  )
}
