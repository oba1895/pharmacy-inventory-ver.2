import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import client from '../api/client'

interface Props {
  onUnlock: () => void
}

export default function AutoLockOverlay({ onUnlock }: Props) {
  const { user, login, logout } = useAuth()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleUnlock = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await client.post('/auth/pin', { pin: '' })
      login(res.data.token, res.data.user)
      onUnlock()
    } catch {
      setError('ロック解除に失敗しました')
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

        {error && (
          <p className="text-red-400 text-sm font-medium mb-4">{error}</p>
        )}

        <button
          onClick={handleUnlock}
          disabled={loading}
          className="btn-primary w-full text-lg py-4 rounded-2xl disabled:opacity-50"
        >
          {loading ? '解除中...' : 'ロックを解除する'}
        </button>

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
