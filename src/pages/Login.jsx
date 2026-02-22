import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Login.css'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-bg">
      {/* Decorative crosses */}
      <div className="deco-cross cross-1">✛</div>
      <div className="deco-cross cross-2">✛</div>
      <div className="deco-cross cross-3">✛</div>

      <div className="login-card fade-in">
        <div className="login-header">
          <div className="login-logo">🕊️</div>
          <h1 className="login-title">Sistema Iglesia</h1>
          <p className="login-sub">Ingresa tus credenciales para continuar</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={submit} className="login-form">
          <div className="form-group">
            <label className="form-label">Correo electrónico</label>
            <input
              name="email"
              type="email"
              className="form-input"
              placeholder="admin@iglesia.com"
              value={form.email}
              onChange={handle}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              name="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={form.password}
              onChange={handle}
              required
            />
          </div>
          <button type="submit" className="btn btn-gold login-btn" disabled={loading}>
            {loading ? <><span className="spinner" style={{width:16,height:16}} /> Entrando...</> : 'Iniciar sesión'}
          </button>
        </form>

        <div className="login-divider">
          <span>Sistema de Gestión Integral</span>
        </div>
      </div>
    </div>
  )
}
