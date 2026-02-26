import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Login.css'

export default function Login() {
  const { login, loginMiembro } = useAuth()
  const navigate = useNavigate()
  const [modo, setModo] = useState('admin') // 'admin' | 'miembro'
  const [form, setForm] = useState({ email: '', password: '', cedula: '', nombres: '', apellidos: '', fecha_nacimiento: '' })
  const [esMenor, setEsMenor] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (modo === 'admin') {
        await login(form.email, form.password)
        navigate('/')
      } else {
        await loginMiembro(esMenor ? { nombres: form.nombres, apellidos: form.apellidos, fecha_nacimiento: form.fecha_nacimiento } : { cedula: form.cedula })
        navigate('/miembro/')
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'No se encontraron datos con esa información')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-bg">
      <div className="deco-cross cross-1">âœ›</div>
      <div className="deco-cross cross-2">âœ›</div>
      <div className="deco-cross cross-3">âœ›</div>
      <div className="login-card fade-in">
        <div className="login-header">
          <div className="login-logo">
            <img src="/logo.jpg" alt="Logo" style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover' }} />
          </div>
          <h1 className="login-title">Ministerio San Juan 7:38</h1>
          <p className="login-sub">Del Semillero 1/11</p>
        </div>

        {/* Selector de modo */}
        <div style={{ display:'flex', background:'var(--surface-2)', borderRadius:10, padding:4, marginBottom:20, gap:4 }}>
          <button type="button" onClick={() => setModo('admin')} style={{ flex:1, padding:'8px 0', borderRadius:8, border:'none', cursor:'pointer', fontWeight:600, fontSize:13, background: modo==='admin' ? 'var(--gold)' : 'transparent', color: modo==='admin' ? '#000' : 'var(--text-muted)', transition:'all .2s' }}>
            👑 Administración
          </button>
          <button type="button" onClick={() => setModo('miembro')} style={{ flex:1, padding:'8px 0', borderRadius:8, border:'none', cursor:'pointer', fontWeight:600, fontSize:13, background: modo==='miembro' ? 'var(--gold)' : 'transparent', color: modo==='miembro' ? '#000' : 'var(--text-muted)', transition:'all .2s' }}>
            🙏 Soy miembro
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={submit} className="login-form">
          {modo === 'admin' ? (
            <>
              <div className="form-group">
                <label className="form-label">Correo electrónico</label>
                <input name="email" type="email" className="form-input" placeholder="admin@iglesia.com" value={form.email} onChange={handle} required />
              </div>
              <div className="form-group">
                <label className="form-label">Contraseña</label>
                <input name="password" type="password" className="form-input" placeholder="••••••••" value={form.password} onChange={handle} required />
              </div>
            </>
          ) : (
            <>
              {/* Toggle adulto/menor */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:16 }}>
                <button type="button" onClick={() => setEsMenor(false)} style={{ padding:'6px 16px', borderRadius:20, border:'1px solid var(--border)', cursor:'pointer', fontWeight:600, fontSize:12, background: !esMenor ? 'var(--surface-2)' : 'transparent', color: !esMenor ? 'var(--gold)' : 'var(--text-muted)' }}>
                  Adulto
                </button>
                <button type="button" onClick={() => setEsMenor(true)} style={{ padding:'6px 16px', borderRadius:20, border:'1px solid var(--border)', cursor:'pointer', fontWeight:600, fontSize:12, background: esMenor ? 'var(--surface-2)' : 'transparent', color: esMenor ? 'var(--gold)' : 'var(--text-muted)' }}>
                  Menor de edad
                </button>
              </div>

              {!esMenor ? (
                <div className="form-group">
                  <label className="form-label">Número de cédula</label>
                  <input name="cedula" type="text" className="form-input" placeholder="000-0000000-0" value={form.cedula} onChange={handle} required />
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Nombres</label>
                    <input name="nombres" type="text" className="form-input" placeholder="Nombres completos" value={form.nombres} onChange={handle} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Apellidos</label>
                    <input name="apellidos" type="text" className="form-input" placeholder="Apellidos completos" value={form.apellidos} onChange={handle} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fecha de nacimiento</label>
                    <input name="fecha_nacimiento" type="date" className="form-input" value={form.fecha_nacimiento} onChange={handle} required />
                  </div>
                </>
              )}
            </>
          )}

          <button type="submit" className="btn btn-gold login-btn" disabled={loading}>
            {loading ? <><span className="spinner" style={{width:16,height:16}} /> Buscando...</> : modo === 'admin' ? 'Iniciar sesión' : 'Entrar'}
          </button>
        </form>

        <div className="login-divider"><span>Sistema de Gestión Integral</span></div>
        <div style={{ textAlign:'center', marginTop:16, padding:'0 8px' }}>
          <p style={{ fontStyle:'italic', fontSize:13, color:'var(--text-muted)', lineHeight:1.7 }}>
            "El que cree en mí, como dice la Escritura, de su interior correrán ríos de agua viva."
          </p>
            <span style={{ color:'var(--gold)', fontSize:12, fontWeight:600 }}>— Juan 7:38</span>
        </div>
      </div>
    </div>
  )
}

