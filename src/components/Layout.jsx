import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePermisos } from '../context/PermisosContext'
import { getAnuncios } from '../api/client'
import './Layout.css'

const NAV_ADMIN = [
  { to: '/',            label: 'Panel',           icono: '🏠', seccion: 'panel' },
  { to: '/miembros',    label: 'Miembros',         icono: '👥', seccion: 'miembros' },
  { to: '/tesoreria',   label: 'Tesorería',        icono: '💰', seccion: 'tesoreria' },
  { to: '/finanzas',    label: 'Finanzas',         icono: '📊', seccion: 'finanzas' },
  { to: '/reportes',    label: 'Reportes',         icono: '📋', seccion: 'reportes' },
  { to: '/inventario',  label: 'Inventario',       icono: '📦', seccion: 'inventario' },
  { to: '/eventos',     label: 'Eventos',          icono: '📅', seccion: 'eventos' },
  { to: '/asistencia',  label: 'Asistencia',       icono: '✅', seccion: 'asistencia' },
  { to: '/pastora',     label: 'Pastora',          icono: '✝️', seccion: 'pastora' },
  { to: '/programa',    label: 'Programa',         icono: '📖', seccion: 'programa' },
  { to: '/anuncios',    label: 'Anuncios',         icono: '📢', seccion: 'anuncios', badge: true },
  { to: '/documentos',  label: 'Documentos',       icono: '📄', seccion: 'documentos' },
  { to: '/respaldo',    label: 'Respaldo',         icono: '💾', seccion: 'respaldo' },
  { to: '/configuracion', label: 'Configuración',  icono: '⚙️', seccion: 'configuracion' },
]

const NAV_MIEMBRO = [
  { to: '/miembro/',          label: 'Panel',        icono: '🏠', seccion: 'panel' },
  { to: '/miembro/eventos',   label: 'Eventos',      icono: '📅', seccion: 'eventos' },
  { to: '/miembro/programa',  label: 'Programa',     icono: '📖', seccion: 'programa' },
  { to: '/miembro/anuncios',  label: 'Anuncios',     icono: '📢', seccion: 'anuncios', badge: true },
  { to: '/miembro/perfil',    label: 'Mi Perfil',    icono: '👤', seccion: 'panel' },
  { to: '/miembro/pastora',   label: 'Info Pastoral',icono: '✝️', seccion: 'pastora' },
]

const NAV = [
  { to: '/',            label: 'Panel',           icono: '🏠', seccion: 'panel' },
  { to: '/miembros',    label: 'Miembros',         icono: '👥', seccion: 'miembros' },
  { to: '/tesoreria',   label: 'Tesorería',        icono: '💰', seccion: 'tesoreria' },
  { to: '/finanzas',    label: 'Finanzas',         icono: '📊', seccion: 'finanzas' },
  { to: '/reportes',    label: 'Reportes',         icono: '📋', seccion: 'reportes' },
  { to: '/inventario',  label: 'Inventario',       icono: '📦', seccion: 'inventario' },
  { to: '/eventos',     label: 'Eventos',          icono: '📅', seccion: 'eventos' },
  { to: '/asistencia',  label: 'Asistencia',       icono: '✅', seccion: 'asistencia' },
  { to: '/pastora',     label: 'Pastora',          icono: '✝️', seccion: 'pastora' },
  { to: '/programa',    label: 'Programa',         icono: '📖', seccion: 'programa' },
  { to: '/anuncios',    label: 'Anuncios',         icono: '📢', seccion: 'anuncios', badge: true },
  { to: '/documentos',  label: 'Documentos',       icono: '📄', seccion: 'documentos' },
  { to: '/respaldo',    label: 'Respaldo',         icono: '💾', seccion: 'respaldo' },
  { to: '/configuracion', label: 'Configuración',  icono: '⚙️', seccion: 'configuracion' },
]

const ANUNCIOS_KEY = 'anuncios_visto_en'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const { puede } = usePermisos()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [hayAnunciosNuevos, setHayAnunciosNuevos] = useState(false)

  const ROLES_PANEL_ADMIN = ['admin','pastor','pastora','secretaria','secretario','copastor','copastora','tesorero','tesorera','diacono','maestra']
  const rol = user?.rol?.toLowerCase() || ''
  const esPortalMiembro = user?.tipo === 'miembro' && !ROLES_PANEL_ADMIN.includes(rol)
  const navItems = esPortalMiembro ? NAV_MIEMBRO : NAV.filter(({ seccion }) => puede(seccion))

  // Detectar si está en página de anuncios y marcar como visto
  const enAnuncios = location.pathname.includes('anuncios')
  useEffect(() => {
    if (enAnuncios) {
      localStorage.setItem(ANUNCIOS_KEY, new Date().toISOString())
      setHayAnunciosNuevos(false)
    }
  }, [enAnuncios])

  // Verificar si hay anuncios nuevos al cargar
  useEffect(() => {
    if (enAnuncios) return
    getAnuncios().then(r => {
      const lista = r.data || []
      if (lista.length === 0) return
      const visto = localStorage.getItem(ANUNCIOS_KEY)
      if (!visto) { setHayAnunciosNuevos(true); return }
      const ultimoAnuncio = lista.reduce((max, a) => {
        const f = new Date(a.created_at || a.fecha || 0)
        return f > max ? f : max
      }, new Date(0))
      setHayAnunciosNuevos(ultimoAnuncio > new Date(visto))
    }).catch(() => {})
  }, [])

  const handleLogout = () => { logout(); navigate('/login') }
  const cerrarMenu = () => setMenuAbierto(false)

  return (
    <div className="layout">
      <div className={`sidebar-overlay ${menuAbierto ? 'open' : ''}`} onClick={cerrarMenu} />

      <aside className={`sidebar ${menuAbierto ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <img src="/logo.jpg" alt="Logo" style={{ width:42, height:42, borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />
          <div>
            <div className="logo-name" style={{ fontSize:12, lineHeight:1.3 }}>Ministerio San Juan 7:38</div>
            <div className="logo-sub" style={{ fontSize:10 }}>Del Semillero 1/11</div>
            <div className="logo-sub">{esPortalMiembro ? 'Portal del miembro' : 'Panel de gestión'}</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(({ to, label, icono, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/' || to === '/miembro/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={cerrarMenu}
            >
              <span className="nav-icon">{icono}</span>
              <span style={{ flex:1 }}>{label}</span>
              {badge && hayAnunciosNuevos && (
                <span style={{
                  width:8, height:8, borderRadius:'50%',
                  background:'#e74c3c', flexShrink:0,
                  boxShadow:'0 0 6px rgba(231,76,60,0.8)'
                }} />
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{user?.nombre?.[0]?.toUpperCase()}</div>
            <div className="user-info">
              <div className="user-name">{user?.nombre}</div>
              <div className="user-role">{user?.rol}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Cerrar sesión">⏻</button>
        </div>
      </aside>

      <div className="main-content">
        <div className="mobile-topbar">
          <button className="menu-toggle" onClick={() => setMenuAbierto(!menuAbierto)}>☰</button>
          <div className="mobile-topbar-logo">
            <img src="/logo.jpg" alt="Logo" style={{ width:32, height:32, borderRadius:'50%', objectFit:'cover' }} />
            <div>
              <div className="mobile-topbar-title">Ministerio San Juan 7:38</div>
              <div className="mobile-topbar-sub">Del Semillero 1/11</div>
            </div>
          </div>
        </div>
        <div className="content-inner">
          {children}
        </div>
      </div>
    </div>
  )
}
