import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Permiso { modulo: string; rol: string; permitido: boolean }

interface PermisosContextValue {
  permisos: Permiso[]
  loading: boolean
  canAccess: (modulo: string, rol: string) => boolean
  togglePermiso: (modulo: string, rol: string, current: boolean) => Promise<void>
}

const PermisosContext = createContext<PermisosContextValue>({
  permisos: [], loading: true,
  canAccess: () => false,
  togglePermiso: async () => {},
})

export function PermisosProvider({ children }: { children: React.ReactNode }) {
  const [permisos, setPermisos] = useState<Permiso[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data } = await supabase.from('permisos_modulo').select('*')
    setPermisos((data as Permiso[]) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function canAccess(modulo: string, rol: string) {
    const p = permisos.find(p => p.modulo === modulo && p.rol === rol)
    return p?.permitido ?? false
  }

  async function togglePermiso(modulo: string, rol: string, current: boolean) {
    const newVal = !current
    // Optimistic update
    setPermisos(prev => {
      const exists = prev.find(p => p.modulo === modulo && p.rol === rol)
      if (exists) return prev.map(p => p.modulo === modulo && p.rol === rol ? { ...p, permitido: newVal } : p)
      return [...prev, { modulo, rol, permitido: newVal }]
    })
    await supabase.from('permisos_modulo').upsert(
      { modulo, rol, permitido: newVal },
      { onConflict: 'modulo,rol' }
    )
  }

  return (
    <PermisosContext.Provider value={{ permisos, loading, canAccess, togglePermiso }}>
      {children}
    </PermisosContext.Provider>
  )
}

export const usePermisos = () => useContext(PermisosContext)
