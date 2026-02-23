import { createContext, useContext } from 'react'
import { useAuth } from './AuthContext'

const PERMISOS = {
  admin:      ['panel','miembros','tesoreria','reportes','inventario','eventos','asistencia','pastora','programa','anuncios','respaldo'],
  pastor:     ['panel','miembros','tesoreria','reportes','inventario','eventos','asistencia','pastora','programa','anuncios','respaldo'],
  pastora:    ['panel','miembros','tesoreria','reportes','inventario','eventos','asistencia','pastora','programa','anuncios','respaldo'],
  copastor:   ['panel','miembros','tesoreria','reportes','inventario','eventos','asistencia','pastora','programa','anuncios','respaldo'],
  copastora:  ['panel','miembros','tesoreria','reportes','inventario','eventos','asistencia','pastora','programa','anuncios','respaldo'],
  secretaria: ['panel','miembros','tesoreria','reportes','inventario','eventos','asistencia','pastora','programa','anuncios','respaldo'],
  diacono:    ['panel','miembros','eventos','asistencia','programa'],
  maestra:    ['panel','programa','asistencia','anuncios'],
  tesorero:   ['panel','tesoreria','reportes','respaldo'],
  tesorera:   ['panel','tesoreria','reportes','respaldo'],
}

const PermisosContext = createContext(null)

export function PermisosProvider({ children }) {
  const { user } = useAuth()
  const rol = user?.rol?.toLowerCase() || ''
  const permisos = PERMISOS[rol] || ['panel']

  const puede = (seccion) => permisos.includes(seccion)

  return (
    <PermisosContext.Provider value={{ puede, permisos, rol }}>
      {children}
    </PermisosContext.Provider>
  )
}

export const usePermisos = () => useContext(PermisosContext)
