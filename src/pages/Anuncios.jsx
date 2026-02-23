import { useState, useEffect } from 'react'

const STORAGE_KEY = 'anuncios_iglesia'

const PRIORIDAD_BADGE = {
  alta: { label:'Urgente', color:'var(--red)' },
  media: { label:'Normal', color:'var(--gold)' },
  baja: { label:'Informativo', color:'var(--green)' },
}

const emptyForm = () => ({ titulo:'', contenido:'', prioridad:'media', fecha_expira:'' })

export default function Anuncios() {
  const [anuncios, setAnuncios] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] }
    catch { return [] }
  })
  const [form, setForm] = useState(emptyForm())
  const [editando, setEditando] = useState(null)
  const [modal, setModal] = useState(false)
  const h = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const guardar = () => {
    if (!form.titulo || !form.contenido) return
    let nuevos
    if (editando !== null) {
      nuevos = anuncios.map((a, i) => i === editando ? { ...form, fecha: a.fecha } : a)
      setEditando(null)
    } else {
      nuevos = [{ ...form, fecha: new Date().toISOString() }, ...anuncios]
    }
    setAnuncios(nuevos)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevos))
    setForm(emptyForm())
    setModal(false)
  }

  const eliminar = (i) => {
    if (!confirm('¿Eliminar este anuncio?')) return
    const nuevos = anuncios.filter((_, j) => j !== i)
    setAnuncios(nuevos)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevos))
  }

  const editar = (i) => {
    setForm(anuncios[i])
    setEditando(i)
    setModal(true)
  }

  const hoy = new Date().toISOString().split('T')[0]
  const activos = anuncios.filter(a => !a.fecha_expira || a.fecha_expira >= hoy)
  const expirados = anuncios.filter(a => a.fecha_expira && a.fecha_expira < hoy)

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Anuncios</h1>
          <p className="page-subtitle">{activos.length} anuncio{activos.length !== 1 ? 's' : ''} activo{activos.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-gold" onClick={() => { setForm(emptyForm()); setEditando(null); setModal(true) }}>+ Nuevo anuncio</button>
      </div>

      {activos.length === 0 && (
        <div className="card" style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📢</div>
          <p>No hay anuncios activos. Crea uno nuevo.</p>
        </div>
      )}

      {activos.map((a, i) => (
        <div key={i} className="card" style={{ marginBottom:14, borderLeft:`3px solid ${PRIORIDAD_BADGE[a.prioridad]?.color || 'var(--gold)'}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                <span style={{ background: PRIORIDAD_BADGE[a.prioridad]?.color, color:'#fff', fontSize:11, fontWeight:700, borderRadius:4, padding:'2px 8px' }}>
                  {PRIORIDAD_BADGE[a.prioridad]?.label}
                </span>
                <span style={{ color:'var(--text-muted)', fontSize:12 }}>
                  {new Date(a.fecha).toLocaleDateString('es-DO')}
                </span>
                {a.fecha_expira && (
                  <span style={{ color:'var(--text-muted)', fontSize:12 }}>
                    · Expira: {new Date(a.fecha_expira).toLocaleDateString('es-DO')}
                  </span>
                )}
              </div>
              <h3 style={{ fontFamily:'var(--font-heading)', fontSize:16, fontWeight:700, marginBottom:6 }}>{a.titulo}</h3>
              <p style={{ color:'var(--text-muted)', fontSize:14, lineHeight:1.6, whiteSpace:'pre-wrap' }}>{a.contenido}</p>
            </div>
            <div style={{ display:'flex', gap:6, flexShrink:0 }}>
              <button className="btn btn-ghost" style={{ padding:'5px 10px', fontSize:12 }} onClick={() => editar(i)}>Editar</button>
              <button className="btn btn-danger" style={{ padding:'5px 10px', fontSize:12 }} onClick={() => eliminar(i)}>✕</button>
            </div>
          </div>
        </div>
      ))}

      {expirados.length > 0 && (
        <div style={{ marginTop:24 }}>
          <h3 style={{ color:'var(--text-muted)', fontSize:13, textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>Anuncios expirados</h3>
          {expirados.map((a, i) => (
            <div key={i} className="card" style={{ marginBottom:10, opacity:0.5 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <span style={{ fontWeight:600, fontSize:14 }}>{a.titulo}</span>
                  <span style={{ color:'var(--text-muted)', fontSize:12, marginLeft:10 }}>Expiró: {new Date(a.fecha_expira).toLocaleDateString('es-DO')}</span>
                </div>
                <button className="btn btn-danger" style={{ padding:'4px 10px', fontSize:12 }} onClick={() => eliminar(anuncios.indexOf(a))}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal" style={{ maxWidth:520 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editando !== null ? 'Editar anuncio' : 'Nuevo anuncio'}</h3>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div className="form-group">
                <label className="form-label">Titulo *</label>
                <input name="titulo" value={form.titulo} onChange={h} className="form-input" placeholder="Ej: Retiro congregacional este sabado" required />
              </div>
              <div className="form-group">
                <label className="form-label">Contenido *</label>
                <textarea name="contenido" value={form.contenido} onChange={h} className="form-input" rows={4} style={{ resize:'vertical' }} placeholder="Escribe aquí el detalle del anuncio..." />
              </div>
              <div className="grid-2" style={{ gap:12 }}>
                <div className="form-group">
                  <label className="form-label">Prioridad</label>
                  <select name="prioridad" value={form.prioridad} onChange={h} className="form-input">
                    <option value="alta">Urgente</option>
                    <option value="media">Normal</option>
                    <option value="baja">Informativo</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha de expiracion</label>
                  <DatePicker name="fecha_expira" value={form.fecha_expira} onChange={h} />
                </div>
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
                <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
                <button className="btn btn-gold" onClick={guardar}>
                  {editando !== null ? 'Actualizar' : 'Publicar anuncio'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


