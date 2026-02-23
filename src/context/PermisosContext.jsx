import { createContext, useContext } from 'react'
import { useAuth } from './AuthContext'

const PERMISOS = {
  admin:      ['panel','miembros','tesoreria','finanzas','reportes','inventario','eventos','asistencia','pastora','programa','anuncios','documentos','respaldo','ver_balance'],
  pastor:     ['panel','miembros','tesoreria','finanzas','reportes','inventario','eventos','asistencia','pastora','programa','anuncios','documentos','respaldo','ver_balance'],
  pastora:    ['panel','miembros','tesoreria','finanzas','reportes','inventario','eventos','asistencia','pastora','programa','anuncios','documentos','respaldo','ver_balance'],
  copastor:   ['panel','miembros','tesoreria','finanzas','reportes','inventario','eventos','asistencia','pastora','programa','anuncios','documentos','respaldo','ver_balance'],
  copastora:  ['panel','miembros','tesoreria','finanzas','reportes','inventario','eventos','asistencia','pastora','programa','anuncios','documentos','respaldo','ver_balance'],
  secretaria: ['panel','miembros','tesoreria','finanzas','reportes','inventario','eventos','asistencia','pastora','programa','anuncios','documentos','respaldo','ver_balance'],
  tesorero:   ['panel','tesoreria','finanzas','reportes','respaldo','ver_balance'],
  tesorera:   ['panel','tesoreria','finanzas','reportes','respaldo','ver_balance'],
  diacono:    ['panel','miembros','eventos','asistencia','programa'],
  maestra:    ['panel','programa','asistencia','anuncios'],
  miembro:    ['panel','programa','eventos'],
}

const PermisosContext = createContext(null)

export function PermisosProvider({ children }) {
  const { user } = useAuth()
  const rol = user?.rol?.toLowerCase() || ''
  const permisos = PERMISOS[rol] || ['panel','programa','eventos']

  const puede = (seccion) => permisos.includes(seccion)

  return (
    <PermisosContext.Provider value={{ puede, permisos, rol }}>
      {children}
    </PermisosContext.Provider>
  )
}

export const usePermisos = () => useContext(PermisosContext)
