import type { ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { useAutoLock } from './hooks/useAutoLock'
import AutoLockOverlay from './components/AutoLockOverlay'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/AdminPage'
import ViewerPage from './pages/ViewerPage'

function ProtectedRoute({ children, role }: { children: ReactNode; role: 'admin' | 'viewer' }) {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== role) return <Navigate to={user?.role === 'admin' ? '/admin' : '/viewer'} replace />
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
  const { isAuthenticated, user } = useAuth()

  return (
    <BrowserRouter>
      <AuthenticatedLayout>
        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated
                ? <Navigate to={user?.role === 'admin' ? '/admin' : '/viewer'} replace />
                : <LoginPage />
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/viewer"
            element={
              <ProtectedRoute role="viewer">
                <ViewerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={
              <Navigate to={isAuthenticated ? (user?.role === 'admin' ? '/admin' : '/viewer') : '/login'} replace />
            }
          />
        </Routes>
      </AuthenticatedLayout>
    </BrowserRouter>
  )
}
