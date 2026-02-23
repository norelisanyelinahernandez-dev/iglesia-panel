import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePermisos } from '../context/PermisosContext'
import './Layout.css'

const NAV = [
  { to: '/',            label: 'Panel',      seccion: 'panel' },
  { to: '/miembros',    label: 'Miembros',   seccion: 'miembros' },
  { to: '/tesoreria',   label: 'Tesoreria',  seccion: 'tesoreria' },
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

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src="/logo.jpg" alt="Logo" style={{ width:42, height:42, borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />
          <div>
            <div className="logo-name" style={{ fontSize:12, lineHeight:1.3 }}>Ministerio San Juan 7:38</div>
            <div className="logo-sub" style={{ fontSize:10 }}>Del Semillero 1/11</div>
            <div className="logo-sub">Panel de gestion</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {NAV.filter(({ seccion }) => puede(seccion)).map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
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
          <button className="logout-btn" onClick={handleLogout} title="Cerrar sesion">X</button>
        </div>
      </aside>
      <main className="main-content">
        <div className="content-inner">
          {children}
        </div>
      </main>
    </div>
  )
}
