import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePermisos } from '../context/PermisosContext'
import './Layout.css'

const NAV = [
  { to: '/',            label: 'Panel',      seccion: 'panel' },
  { to: '/miembros',    label: 'Miembros',   seccion: 'miembros' },
  { to: '/Tesorería',   label: 'Tesorería',  seccion: 'Tesorería' },
  { to: '/finanzas',    label: 'Finanzas',   seccion: 'finanzas' },
  { to: '/reportes',    label: 'Reportes',   seccion: 'reportes' },
  { to: '/inventario',  label: 'Inventario', seccion: 'inventario' },
  { to: '/eventos',     label: 'Eventos',    seccion: 'eventos' },
  { to: '/asistencia',  label: 'Asistencia', seccion: 'asistencia' },
  { to: '/pastora',     label: 'Pastora',    seccion: 'pastora' },
  { to: '/programa',    label: 'Programa',   seccion: 'programa' },
  { to: '/anuncios',    label: 'Anuncios',   seccion: 'anuncios' },
  { to: '/documentos',  label: 'Documentos', seccion: 'documentos' },
  { to: '/respaldo',    label: 'Respaldo',   seccion: 'respaldo' },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const { puede } = usePermisos()
  const navigate = useNavigate()
  const [menuAbierto, setMenuAbierto] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

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
            <div className="logo-sub">Panel de gestión</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {NAV.filter(({ seccion }) => puede(seccion)).map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={cerrarMenu}
            >
              <span>{label}</span>
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
          <button className="logout-btn" onClick={handleLogout} title="Cerrar sesión">X</button>
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


