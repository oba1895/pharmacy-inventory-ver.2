import type { ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { useAutoLock } from './hooks/useAutoLock'
import AutoLockOverlay from './components/AutoLockOverlay'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/AdminPage'
import ViewerPage from './pages/ViewerPage'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/viewer" replace />
  return <>{children}</>
}

function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const { isLocked, unlock } = useAutoLock(isAuthenticated)

  return (
    <>
      {isAuthenticated && isLocked && <AutoLockOverlay onUnlock={unlock} />}
      {children}
    </>
  )
}

export default function App() {
  const { isAuthenticated } = useAuth()

  return (
    <BrowserRouter>
      <AuthenticatedLayout>
        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated
                ? <Navigate to="/admin" replace />
                : <LoginPage />
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route path="/viewer" element={<ViewerPage />} />
          <Route path="*" element={<Navigate to="/viewer" replace />} />
        </Routes>
      </AuthenticatedLayout>
    </BrowserRouter>
  )
}
