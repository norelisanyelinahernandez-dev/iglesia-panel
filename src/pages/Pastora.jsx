import { useState, useEffect } from 'react'
import Toast from '../components/Toast'
import { getPastora, savePastora } from '../api/client'

const EMPTY = { nombre:'', cargo:'', telefono:'', email:'', direccion:'', biografia:'', versiculo:'', anios_ministerio:'', especialidad:'', foto_url:'' }

export default function Pastora() {
  const [toast, setToast] = useState(null)
  const mostrarError = (msg) => setToast({ mensaje: msg, tipo: 'error' })
  const [perfil, setPerfil] = useState(EMPTY)
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [guardado, setGuardado] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPastora().then(r => {
      const data = r.data || EMPTY
      setPerfil(data)
      setForm(data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const h = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const guardar = async (e) => {
    e.preventDefault()
    try {
      await savePastora(form)
      setPerfil(form)
      setEditando(false)
      setGuardado(true)
      setTimeout(() => setGuardado(false), 3000)
    } catch(_) { mostrarError('Ocurrio un error inesperado. Intenta de nuevo.') }
  }

  const campo = (label, value) => value ? (
    <div style={{ marginBottom:10 }}>
      <div style={{ color:'var(--text-muted)', fontSize:12, marginBottom:2 }}>{label}</div>
      <div style={{ fontWeight:500 }}>{value}</div>
    </div>
  ) : null

  if (loading) return <div style={{ textAlign:'center', padding:60 }}><span className="spinner" /></div>

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Perfil de la Pastora</h1>
          <p className="page-subtitle">Información pastoral y ministerial</p>
        </div>
        {!editando && (
          <button className="btn btn-gold" onClick={() => { setForm(perfil); setEditando(true) }}>✏️ Editar perfil</button>
        )}
      </div>

      {guardado && <div className="alert alert-success" style={{ marginBottom:16 }}>✅ Perfil guardado correctamente</div>}

      {!editando ? (
        <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
          <div className="card" style={{ flex:'0 0 260px', textAlign:'center', padding:32 }}>
            {perfil.foto_url ? (
              <img src={perfil.foto_url} alt="Foto pastora" style={{ width:140, height:140, borderRadius:'50%', objectFit:'cover', border:'3px solid var(--gold)', marginBottom:16 }} />
            ) : (
              <div style={{ width:140, height:140, borderRadius:'50%', background:'var(--bg-card)', border:'3px solid var(--gold)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:48, margin:'0 auto 16px' }}>👩‍💼</div>
            )}
            <h2 style={{ fontFamily:'var(--font-heading)', fontSize:20, fontWeight:700, marginBottom:4 }}>{perfil.nombre || 'Sin nombre'}</h2>
            <div style={{ color:'var(--gold)', fontWeight:600, marginBottom:8 }}>{perfil.cargo || 'Pastora'}</div>
            {perfil.anios_ministerio && <div style={{ color:'var(--text-muted)', fontSize:13 }}>{perfil.anios_ministerio} años en el ministerio</div>}
          </div>

          <div style={{ flex:1, minWidth:280, display:'flex', flexDirection:'column', gap:16 }}>
            <div className="card">
              <div style={{ borderLeft:'3px solid var(--gold)', paddingLeft:10, marginBottom:14 }}>
                <span style={{ fontFamily:'var(--font-heading)', fontWeight:700, fontSize:13, color:'var(--gold)', textTransform:'uppercase', letterSpacing:1 }}>Información de contacto</span>
              </div>
              {campo('Teléfono', perfil.telefono)}
              {campo('Correo', perfil.email)}
              {campo('Dirección', perfil.direccion)}
              {!perfil.telefono && !perfil.email && !perfil.direccion && <p style={{ color:'var(--text-muted)', fontSize:13 }}>Sin información de contacto</p>}
            </div>
            <div className="card">
              <div style={{ borderLeft:'3px solid var(--gold)', paddingLeft:10, marginBottom:14 }}>
                <span style={{ fontFamily:'var(--font-heading)', fontWeight:700, fontSize:13, color:'var(--gold)', textTransform:'uppercase', letterSpacing:1 }}>Ministerio</span>
              </div>
              {campo('Especialidad', perfil.especialidad)}
              {campo('Biografía', perfil.biografia)}
              {!perfil.especialidad && !perfil.biografia && <p style={{ color:'var(--text-muted)', fontSize:13 }}>Sin información ministerial</p>}
            </div>
            {perfil.versiculo && (
              <div className="card" style={{ borderLeft:'3px solid var(--gold)' }}>
                <p style={{ fontStyle:'italic', fontSize:15, color:'var(--text)', marginBottom:6 }}>"{perfil.versiculo}"</p>
                <span style={{ color:'var(--gold)', fontSize:12, fontWeight:600 }}>— Versículo favorito</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card" style={{ maxWidth:660 }}>
          <form onSubmit={guardar} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ borderLeft:'3px solid var(--gold)', paddingLeft:10, marginBottom:4 }}>
              <span style={{ fontFamily:'var(--font-heading)', fontWeight:700, fontSize:13, color:'var(--gold)', textTransform:'uppercase', letterSpacing:1 }}>Información Personal</span>
            </div>
            <div className="grid-2" style={{ gap:12 }}>
              <div className="form-group">
                <label className="form-label">Nombre completo *</label>
                <input name="nombre" value={form.nombre} onChange={h} className="form-input" required />
              </div>
              <div className="form-group">
                <label className="form-label">Cargo / Título</label>
                <input name="cargo" value={form.cargo} onChange={h} className="form-input" placeholder="Ej: Pastora Principal" />
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input name="telefono" value={form.telefono} onChange={h} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Correo</label>
                <input name="email" type="email" value={form.email} onChange={h} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Años en el ministerio</label>
                <input name="anios_ministerio" value={form.anios_ministerio} onChange={h} className="form-input" placeholder="Ej: 15" />
              </div>
              <div className="form-group">
                <label className="form-label">URL de foto (opcional)</label>
                <input name="foto_url" value={form.foto_url} onChange={h} className="form-input" placeholder="https://..." />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Dirección</label>
              <input name="direccion" value={form.direccion} onChange={h} className="form-input" />
            </div>
            <div style={{ borderLeft:'3px solid var(--gold)', paddingLeft:10, margin:'8px 0 4px' }}>
              <span style={{ fontFamily:'var(--font-heading)', fontWeight:700, fontSize:13, color:'var(--gold)', textTransform:'uppercase', letterSpacing:1 }}>Ministerio</span>
            </div>
            <div className="form-group">
              <label className="form-label">Especialidad ministerial</label>
              <input name="especialidad" value={form.especialidad} onChange={h} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Biografía</label>
              <textarea name="biografia" value={form.biografia} onChange={h} className="form-input" rows={4} style={{ resize:'vertical' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Versículo favorito</label>
              <input name="versiculo" value={form.versiculo} onChange={h} className="form-input" placeholder="Ej: Juan 7:38" />
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:6 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setEditando(false)}>Cancelar</button>
              <button type="submit" className="btn btn-gold">💾 Guardar perfil</button>
            </div>
          </form>
        </div>
      )}
      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast(null)} />}

    </div>
  )
}
