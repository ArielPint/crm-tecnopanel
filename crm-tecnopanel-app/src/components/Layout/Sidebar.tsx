import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Briefcase, Wrench, Box,
  FileText, CreditCard, Users, UserCog, LogOut,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { usePermisos } from '@/contexts/PermisosContext'

const MODULO_MAP: Record<string, string> = {
  Dashboard: 'Dashboard',
  Oportunidades: 'Oportunidades',
  Ingeniería: 'Ingeniería',
  Cubicación: 'Cubicación',
  Presupuestos: 'Presupuestos',
  Crédito: 'Crédito',
  Clientes: 'Clientes',
  Usuarios: 'Usuarios',
}

const ALL_NAV = [
  { label: 'Dashboard',     icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Oportunidades', icon: Briefcase,        to: '/oportunidades' },
  { label: 'Ingeniería',    icon: Wrench,           to: '/ingenieria' },
  { label: 'Cubicación',    icon: Box,              to: '/cubicacion' },
  { label: 'Presupuestos',  icon: FileText,         to: '/presupuestos' },
  { label: 'Crédito',       icon: CreditCard,       to: '/credito' },
  { label: 'Clientes',      icon: Users,            to: '/clientes' },
  { label: 'Usuarios',      icon: UserCog,          to: '/usuarios' },
]

export default function Sidebar() {
  const { profile, signOut } = useAuth()
  const { canAccess, loading } = usePermisos()
  const navigate = useNavigate()

  const visibleNav = loading
    ? ALL_NAV
    : ALL_NAV.filter(item => {
        const modulo = MODULO_MAP[item.label] || item.label
        return canAccess(modulo, profile?.rol || '')
      })

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="w-56 flex-shrink-0 bg-[#1a1a1b] flex flex-col h-full">
      {/* Logo */}
      <div className="px-3 py-4 border-b border-white/10">
        <img
          src="/logo%20horizontal.jpeg"
          alt="TECNOPANEL"
          className="w-full object-contain"
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {visibleNav.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ' +
              (isActive
                ? 'bg-brand-red text-white'
                : 'text-gray-400 hover:bg-white/5 hover:text-white')
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-3 border-t border-white/10">
        {profile && (
          <p className="text-xs text-gray-500 mb-2 truncate">
            {profile.nombre} {profile.apellido}
          </p>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors w-full"
        >
          <LogOut size={14} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
