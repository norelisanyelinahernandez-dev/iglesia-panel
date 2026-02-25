import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

function mostrarExito(msg) {
  const t = document.createElement('div')
  t.style.cssText = 'position:fixed;top:20px;right:20px;z-index:99999;background:#27ae60;color:white;padding:14px 20px;border-radius:8px;font-size:14px;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,0.3);max-width:320px;'
  t.textContent = msg
  document.body.appendChild(t)
  setTimeout(() => t.remove(), 3000)
}

export default function Configuracion() {
  const { user } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // 'nuevo' | 'password'
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')

  const [formNuevo, setFormNuevo] = useState({ nombre: '', email: '', password: '', rol: 'admin' })
  const [formPassword, setFormPassword] = useState({ password_actual: '', password_nuevo: '', confirmar: '' })

  const ROLES = ['admin', 'secretaria', 'secretario', 'pastor', 'pastora', 'copastor', 'copastora', 'tesorero', 'tesorera']

  const load = async () => {
    try {
      const { data } = await api.get('/auth/usuarios')
      setUsuarios(data)
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleCrear = async () => {
    setError('')
    if (!formNuevo.nombre || !formNuevo.email || !formNuevo.password) {
      setError('Todos los campos son obligatorios')
      return
    }
    try {
      await api.post('/auth/usuarios', formNuevo)
      setModal(null)
      setFormNuevo({ nombre: '', email: '', password: '', rol: 'admin' })
      load()
      mostrarExito('Usuario creado exitosamente')
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al crear usuario')
    }
  }

  const handleCambiarPassword = async () => {
    setError('')
    if (!formPassword.password_nuevo || !formPassword.confirmar) {
      setError('Completa todos los campos')
      return
    }
    if (formPassword.password_nuevo !== formPassword.confirmar) {
      setError('Las contrasenas no coinciden')
      return
    }
    if (formPassword.password_nuevo.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres')
      return
    }
    try {
      await api.put(`/auth/usuarios/${selected.id}/password`, {
        password_actual: formPassword.password_actual,
        password_nuevo: formPassword.password_nuevo
      })
      setModal(null)
      setFormPassword({ password_actual: '', password_nuevo: '', confirmar: '' })
      mostrarExito('Contrasena actualizada exitosamente')
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al cambiar contrasena')
    }
  }

  const handleToggleActivo = async (u) => {
    try {
      await api.put(`/auth/usuarios/${u.id}/activo`, { activo: !u.activo })
      load()
      mostrarExito(u.activo ? 'Usuario desactivado' : 'Usuario activado')
    } catch (_) {}
  }

  const handleEliminar = async (u) => {
    if (!window.confirm(`¿Eliminar al usuario ${u.nombre}? Esta accion no se puede deshacer.`)) return
    try {
      await api.delete(`/auth/usuarios/${u.id}`)
      load()
      mostrarExito('Usuario eliminado')
    } catch (_) {}
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Configuracion</h1>
          <p className="page-subtitle">Gestion de usuarios del sistema</p>
        </div>
        <button className="btn btn-gold" onClick={() => { setError(''); setModal('nuevo') }}>
          + Nuevo usuario
        </button>
      </div>

      <div className="card">
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 600, marginBottom: 16 }}>
          Usuarios del sistema
        </h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 30 }}><span className="spinner" /></td></tr>
              ) : usuarios.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>{u.nombre}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{u.email}</td>
                  <td><span style={{ background: 'var(--gold)', color: '#000', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{u.rol}</span></td>
                  <td>
                    <span style={{ color: u.activo ? 'var(--green)' : 'var(--red)', fontWeight: 600, fontSize: 13 }}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm" onClick={() => { setSelected(u); setError(''); setModal('password') }}>
                        Contrasena
                      </button>
                      <button
                        className={`btn btn-sm ${u.activo ? 'btn-danger' : 'btn-gold'}`}
                        onClick={() => handleToggleActivo(u)}
                      >
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </button>
                      {u.email !== user?.email && (
                        <button className="btn btn-sm btn-danger" onClick={() => handleEliminar(u)}>
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Usuario */}
      {modal === 'nuevo' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nuevo usuario</h3>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error">{error}</div>}
              <div className="form-group">
                <label>Nombre completo</label>
                <input className="input" value={formNuevo.nombre} onChange={e => setFormNuevo(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input className="input" type="email" value={formNuevo.email} onChange={e => setFormNuevo(f => ({ ...f, email: e.target.value }))} placeholder="email@iglesia.com" />
              </div>
              <div className="form-group">
                <label>Contrasena</label>
                <input className="input" type="password" value={formNuevo.password} onChange={e => setFormNuevo(f => ({ ...f, password: e.target.value }))} placeholder="Minimo 6 caracteres" />
              </div>
              <div className="form-group">
                <label>Rol</label>
                <select className="input" value={formNuevo.rol} onChange={e => setFormNuevo(f => ({ ...f, rol: e.target.value }))}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-gold" onClick={handleCrear}>Crear usuario</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cambiar Contrasena */}
      {modal === 'password' && selected && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Cambiar contrasena — {selected.nombre}</h3>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error">{error}</div>}
              <div className="form-group">
                <label>Nueva contrasena</label>
                <input className="input" type="password" value={formPassword.password_nuevo} onChange={e => setFormPassword(f => ({ ...f, password_nuevo: e.target.value }))} placeholder="Minimo 6 caracteres" />
              </div>
              <div className="form-group">
                <label>Confirmar contrasena</label>
                <input className="input" type="password" value={formPassword.confirmar} onChange={e => setFormPassword(f => ({ ...f, confirmar: e.target.value }))} placeholder="Repite la contrasena" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-gold" onClick={handleCambiarPassword}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
