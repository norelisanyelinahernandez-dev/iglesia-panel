import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Layout.css'

const NAV = [
  { to: '/',           icon: '◈',  label: 'Panel' },
  { to: '/miembros',   icon: '✦',  label: 'Miembros' },
  { to: '/tesoreria',  icon: '◉',  label: 'Tesorería' },
  { to: '/inventario', icon: '▣',  label: 'Inventario' },
  { to: '/eventos',    icon: '◆',  label: 'Eventos' },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">🕊️</span>
          <div>
            <div className="logo-name">Sistema Iglesia</div>
            <div className="logo-sub">Panel de gestión</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{icon}</span>
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
          <button className="logout-btn" onClick={handleLogout} title="Cerrar sesión">⏻</button>
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
