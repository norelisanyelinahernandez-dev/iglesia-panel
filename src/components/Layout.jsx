import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Layout.css'
const NAV = [
  { to: '/',           icon: 'Panel',     label: 'Panel' },
  { to: '/miembros',   icon: 'Miembros',  label: 'Miembros' },
  { to: '/tesoreria',  icon: 'Tesorer',   label: 'Tesoreria' },
  { to: '/inventario', icon: 'Inventario',label: 'Inventario' },
  { to: '/eventos',    icon: 'Eventos',   label: 'Eventos' },
  { to: '/pastora',    icon: 'Pastora',   label: 'Pastora' },
  { to: '/programa',   icon: 'Programa',  label: 'Programa' },
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
          <img src="/logo.jpg" alt="Logo" style={{ width:42, height:42, borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />
          <div>
            <div className="logo-name" style={{ fontSize:12, lineHeight:1.3 }}>Ministerio San Juan 7:38</div>
            <div className="logo-sub" style={{ fontSize:10 }}>Del Semillero 1/11</div>
            <div className="logo-sub">Panel de gestion</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(({ to, label }) => (
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
