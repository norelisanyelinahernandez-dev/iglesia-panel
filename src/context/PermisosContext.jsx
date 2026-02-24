import { createContext, useContext } from 'react'
import { useAuth } from './AuthContext'

const PERMISOS = {
  admin:      ['panel','miembros','tesoreria','finanzas','reportes','inventario','eventos','asistencia','pastora','programa','anuncios','documentos','respaldo','ver_balance'],
  pastor:     ['panel','miembros','tesoreria','finanzas','reportes','inventario','eventos','asistencia','pastora','programa','anuncios','documentos','respaldo','ver_balance'],
  pastora:    ['panel','miembros','tesoreria','finanzas','reportes','inventario','eventos','asistencia','pastora','programa','anuncios','documentos','respaldo','ver_balance'],
  copastor:   ['panel','miembros','tesoreria','finanzas','reportes','inventario','eventos','asistencia','pastora','programa','anuncios','documentos','respaldo','ver_balance'],
  copastora:  ['panel','miembros','tesoreria','finanzas','reportes','inventario','eventos','asistencia','pastora','programa','anuncios','documentos','respaldo','ver_balance'],
  secretaria: ['panel','miembros','tesoreria','finanzas','reportes','inventario','eventos','asistencia','pastora','programa','anuncios','documentos','respaldo','ver_balance'],
  secretario: ['panel','miembros','tesoreria','finanzas','reportes','inventario','eventos','asistencia','pastora','programa','anuncios','documentos','respaldo','ver_balance'],
  tesorero:   ['panel','tesoreria','finanzas','reportes','respaldo','ver_balance','programa','eventos','anuncios'],
  tesorera:   ['panel','tesoreria','finanzas','reportes','respaldo','ver_balance','programa','eventos','anuncios'],
  diacono:    ['panel','miembros','eventos','asistencia','programa'],
  maestra:    ['panel','programa','asistencia','anuncios'],
  miembro:    ['panel','eventos','pastora','programa'],
}

const PermisosContext = createContext(null)

export function PermisosProvider({ children }) {
  const { user } = useAuth()
  const rol = user?.rol?.toLowerCase() || ''
  const permisos = PERMISOS[rol] || ['panel','programa','eventos']

  // Roles con permiso de edicion total
  const ROLES_EDITOR = ['admin','pastor','pastora','secretaria','secretario']
  // Roles que solo editan finanzas
  const ROLES_TESORERO = ['tesorero','tesorera']
  // Roles de solo lectura (aunque sean miembros con rol especial)
  const ROLES_READONLY = ['copastor','copastora','diacono','maestra','miembro']

  const puede = (seccion) => permisos.includes(seccion)

  // puedeEditar(seccion): true si puede modificar datos en esa seccion
  const puedeEditar = (seccion) => {
    if (ROLES_EDITOR.includes(rol)) return true       // admin/pastor/secretario: editan todo
    if (ROLES_TESORERO.includes(rol)) {               // tesorero/a: solo finanzas
      return ['tesoreria','finanzas'].includes(seccion)
    }
    return false  // copastor/a, diacono, maestra, miembro: solo lectura
  }

  return (
    <PermisosContext.Provider value={{ puede, puedeEditar, permisos, rol }}>
      {children}
    </PermisosContext.Provider>
  )
}

export const usePermisos = () => useContext(PermisosContext)
