import { useState, useEffect } from 'react'
import Toast from '../components/Toast'
import { usePermisos } from '../context/PermisosContext'
import { getAnuncios, createAnuncio, updateAnuncio, deleteAnuncio } from '../api/client'
import DatePicker from '../components/DatePicker'

// Notificacion de exito
function mostrarExito(mensaje) {
  const existing = document.getElementById('_success_toast')
  if (existing) existing.remove()
  const toast = document.createElement('div')
  toast.id = '_success_toast'
  toast.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 99999;
    background: #27ae60; color: white; padding: 14px 20px;
    border-radius: 8px; font-size: 14px; font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3); max-width: 320px;
  `
  toast.textContent = mensaje
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 3000)
}


const PRIORIDAD_BADGE = {
  alta: { label:'Urgente', color:'var(--red)' },
  media: { label:'Normal', color:'var(--gold)' },
  baja: { label:'Informativo', color:'var(--green)' },
}

const emptyForm = () => ({ titulo:'', contenido:'', prioridad:'media', fecha_expira:'' })

export default function Anuncios() {
  const [toast, setToast] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const mostrarError = (msg) => setToast({ mensaje: msg, tipo: 'error' })
  const { puedeEditar } = usePermisos()
  const puedeEdit = puedeEditar('anuncios')
  const [anuncios, setAnuncios] = useState([])
  const [form, setForm] = useState(emptyForm())
  const [editando, setEditando] = useState(null)
  const [modal, setModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const h = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const cargar = async () => {
    try {
      const { data } = await getAnuncios()
      setAnuncios(data)
    } catch(_) { mostrarError('Ocurrio un error inesperado. Intenta de nuevo.') }
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  const guardar = async () => {
    if (!form.titulo || !form.contenido) return
    try {
      const payload = { ...form, fecha_expira: form.fecha_expira || null }
      if (editando !== null) {
        await updateAnuncio(editando, payload)
      } else {
        await createAnuncio(payload)
      }
      setEditando(null)
      setForm(emptyForm())
      setModal(false)
      cargar()
    } catch(_) { mostrarError('Ocurrio un error inesperado. Intenta de nuevo.') }
  }

  const eliminar = async (id) => {
    setConfirmDel(id)
  }
  const handleDelete = async () => {
    if (!confirmDel) return
    try { await deleteAnuncio(confirmDel); setConfirmDel(null); cargar() } catch(_) { mostrarError('No se pudo eliminar.') }
  }

  const editar = (a) => {
    setForm({ titulo: a.titulo, contenido: a.contenido, prioridad: a.prioridad, fecha_expira: a.fecha_expira || '' })
    setEditando(a.id)
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
        {puedeEdit && <button className="btn btn-gold" onClick={() => { setForm(emptyForm()); setEditando(null); setModal(true) }}>+ Nuevo anuncio</button>}
      </div>

      {loading && <div style={{ textAlign:'center', padding:40 }}><span className="spinner" /></div>}

      {!loading && activos.length === 0 && (
        <div className="card" style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>&#x1F4E2;</div>
          <p>No hay anuncios activos. Crea uno nuevo.</p>
        </div>
      )}

      {activos.map((a) => (
        <div key={a.id} className="card" style={{ marginBottom:14, borderLeft:`3px solid ${PRIORIDAD_BADGE[a.prioridad]?.color || 'var(--gold)'}` }}>
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
                    Â· Expira: {new Date(a.fecha_expira).toLocaleDateString('es-DO')}
                  </span>
                )}
              </div>
              <h3 style={{ fontFamily:'var(--font-heading)', fontSize:16, fontWeight:700, marginBottom:6 }}>{a.titulo}</h3>
              <p style={{ color:'var(--text-muted)', fontSize:14, lineHeight:1.6, whiteSpace:'pre-wrap' }}>{a.contenido}</p>
            </div>
            <div style={{ display:'flex', gap:6, flexShrink:0 }}>
              {puedeEdit && <button className="btn btn-ghost" style={{ padding:'5px 10px', fontSize:12 }} onClick={() => editar(a)}>Editar</button>}
              {puedeEdit && <button className="btn btn-danger" style={{ padding:'5px 10px', fontSize:12 }} onClick={() => setConfirmDel(a.id)}>✕</button>}
            </div>
          </div>
        </div>
      ))}

      {expirados.length > 0 && (
        <div style={{ marginTop:24 }}>
          <h3 style={{ color:'var(--text-muted)', fontSize:13, textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>Anuncios expirados</h3>
          {expirados.map((a) => (
            <div key={a.id} className="card" style={{ marginBottom:10, opacity:0.5 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <span style={{ fontWeight:600, fontSize:14 }}>{a.titulo}</span>
                  <span style={{ color:'var(--text-muted)', fontSize:12, marginLeft:10 }}>ExpirÃ³: {new Date(a.fecha_expira).toLocaleDateString('es-DO')}</span>
                </div>
                {puedeEdit && <button className="btn btn-danger" style={{ padding:'4px 10px', fontSize:12 }} onClick={() => setConfirmDel(a.id)}>✕</button>}
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
              <button className="modal-close" onClick={() => setModal(false)}>Ã—</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div className="form-group">
                <label className="form-label">Titulo *</label>
                <input name="titulo" value={form.titulo} onChange={h} className="form-input" placeholder="Ej: Retiro congregacional este sabado" required />
              </div>
              <div className="form-group">
                <label className="form-label">Contenido *</label>
                <textarea name="contenido" value={form.contenido} onChange={h} className="form-input" rows={4} style={{ resize:'vertical' }} placeholder="Escribe aquÃ­ el detalle del anuncio..." />
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
                  <label className="form-label">Fecha de expiraciÃ³n</label>
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
      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast(null)} />}
      {confirmDel && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth:380 }}>
            <div style={{ textAlign:'center', padding:'10px 0 4px' }}>
              <div style={{ fontSize:36, marginBottom:12 }}>&#x26A0;&#xFE0F;</div>
              <h3 style={{ fontFamily:'var(--font-heading)', fontSize:18, marginBottom:8 }}>&#x00BF;Eliminar anuncio?</h3>
              <p style={{ color:'var(--text-muted)', fontSize:13 }}>Esta accion no se puede deshacer.</p>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:16 }}>
              <button className="btn btn-ghost" style={{ flex:1 }} onClick={() => setConfirmDel(null)}>Cancelar</button>
              <button className="btn btn-danger" style={{ flex:1, justifyContent:'center' }} onClick={handleDelete}>Si, eliminar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}



