import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { PermisosProvider, usePermisos } from '@/contexts/PermisosContext'
import { AppLayout } from '@/components/Layout/AppLayout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Oportunidades from '@/pages/Oportunidades'
import Ingenieria from '@/pages/Ingenieria'
import Cubicacion from '@/pages/Cubicacion'
import Presupuestos from '@/pages/Presupuestos'
import Credito from '@/pages/Credito'
import Clientes from '@/pages/Clientes'
import Usuarios from '@/pages/Usuarios'

function ProtectedRoute({ modulo, children }: { modulo: string; children: React.ReactNode }) {
  const { profile } = useAuth()
  const { canAccess, loading } = usePermisos()
  if (loading) return null
  if (!profile || !canAccess(modulo, profile.rol)) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { session, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  )
  if (!session) return <Login />
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/oportunidades" element={<ProtectedRoute modulo="Oportunidades"><Oportunidades /></ProtectedRoute>} />
        <Route path="/ingenieria"    element={<ProtectedRoute modulo="Ingeniería"><Ingenieria /></ProtectedRoute>} />
        <Route path="/cubicacion"    element={<ProtectedRoute modulo="Cubicación"><Cubicacion /></ProtectedRoute>} />
        <Route path="/presupuestos"  element={<ProtectedRoute modulo="Presupuestos"><Presupuestos /></ProtectedRoute>} />
        <Route path="/credito"       element={<ProtectedRoute modulo="Crédito"><Credito /></ProtectedRoute>} />
        <Route path="/clientes"      element={<ProtectedRoute modulo="Clientes"><Clientes /></ProtectedRoute>} />
        <Route path="/usuarios"      element={<ProtectedRoute modulo="Usuarios"><Usuarios /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PermisosProvider>
          <AppRoutes />
        </PermisosProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
