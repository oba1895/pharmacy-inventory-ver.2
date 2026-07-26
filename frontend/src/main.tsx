import React from 'react'
import ReactDOM from 'react-dom/client'

// ── 作成者署名 ──────────────────────────────────────────
console.log(
  '%c💊 臨時購入医薬品 在庫管理システム',
  'color:#fff;background:#1d4ed8;font-size:16px;font-weight:bold;padding:6px 14px;border-radius:6px 6px 0 0;'
)
console.log(
  '%c   Created by  TAKUYA OBARA',
  'color:#1d4ed8;background:#eff6ff;font-size:13px;padding:4px 14px;border-left:4px solid #1d4ed8;'
)
console.log(
  '%c────────────────────────────────────',
  'color:#93c5fd;font-size:10px;'
)
// ────────────────────────────────────────────────────────
import { AuthProvider } from './contexts/AuthContext'
import App from './App'
import './index.css'

// Service Worker を登録（PWA対応）
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // 登録失敗は無視（開発環境など）
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
)
