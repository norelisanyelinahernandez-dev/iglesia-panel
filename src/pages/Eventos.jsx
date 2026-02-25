import { useEffect, useState } from 'react'
import { usePermisos } from '../context/PermisosContext'
import DatePicker from '../components/DatePicker'
import { getEventos, createEvento, deleteEvento, getAsistencia, registrarAsistencia } from '../api/client'

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


const TIPO_BADGE = { culto:'badge-gold', retiro:'badge-blue', conferencia:'badge-blue', boda:'badge-green', bautismo:'badge-gold', celula:'badge-amber', otro:'badge-green' }
const TIPO_EMOJI = { culto:'⛪', retiro:'🏕️', conferencia:'🎤', boda:'💍', bautismo:'💧', celula:'👥', otro:'📅' }
const TIPO_LABEL = { culto:'Culto', retiro:'Retiro', conferencia:'Conferencia', boda:'Boda', bautismo:'Bautismo', celula:'C\u00e9lula', otro:'Otro' }

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function Eventos() {
  const { puedeEditar } = usePermisos()
  const puedeEdit = puedeEditar('eventos')
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [asistenciaEvento, setAsistenciaEvento] = useState(null)
  const [asistenciaData, setAsistenciaData] = useState(null)
  const [form, setForm] = useState({ nombre:'', tipo:'culto', descripcion:'', fecha_inicio:'', fecha_fin:'', lugar:'' })
  const [asForm, setAsForm] = useState({ nombre_visita:'', telefono_visita:'' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try { const { data } = await getEventos(); setEventos(data) } catch(_) {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const loadAsistencia = async (evento) => {
    setAsistenciaEvento(evento)
    setAsistenciaData(null)
    try { const { data } = await getAsistencia(evento.id); setAsistenciaData(data) } catch(_) {}
  }

  const submitEvento = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      if (!form.fecha_inicio) { setError("La fecha es requerida"); setSaving(false); return }
      const d = new Date(form.fecha_inicio)
      if (isNaN(d.getTime())) { setError("Fecha inválida"); setSaving(false); return }
      const payload = {
        nombre: form.nombre,
        tipo: form.tipo || null,
        descripcion: form.descripcion || null,
        lugar: form.lugar || null,
        fecha_inicio: d.toISOString(),
        fecha_fin: form.fecha_fin ? new Date(form.fecha_fin).toISOString() : null,
      }
      await createEvento(payload)
      load(); setModal(null)
      setForm({ nombre:'', tipo:'culto', descripcion:'', fecha_inicio:'', fecha_fin:'', lugar:'' })
    } catch(err) {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        setError(detail.map(d => d.msg || JSON.stringify(d)).join(', '))
      } else {
        setError(typeof detail === 'string' ? detail : 'Error al crear evento')
      }
    }
    setSaving(false)
  }

  const submitAsistencia = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await registrarAsistencia(asistenciaEvento.id, { nombre_visita: asForm.nombre_visita, telefono_visita: asForm.telefono_visita, presente: true })
      const { data } = await getAsistencia(asistenciaEvento.id)
      setAsistenciaData(data)
      setAsForm({ nombre_visita:'', telefono_visita:'' })
    } catch(_) {}
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('\u00bfEliminar este evento?')) return
    try { await deleteEvento(id); load() } catch(_) {}
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Eventos</h1>
          <p className="page-subtitle">{eventos.length} eventos registrados</p>
        </div>
        {puedeEdit && <button className="btn btn-gold" onClick={() => { setError(''); setModal('nuevo') }}>+ Nuevo evento</button>}
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:24, flexWrap:'wrap' }}>
        {['culto','retiro','boda','bautismo','conferencia','celula'].map(tipo => {
          const count = eventos.filter(e=>e.tipo===tipo).length
          if (count === 0) return null
          return (
            <div key={tipo} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 16px', display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:18 }}>{TIPO_EMOJI[tipo]}</span>
              <div>
                <div style={{ fontWeight:600, fontSize:16 }}>{count}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>{TIPO_LABEL[tipo]}s</div>
              </div>
            </div>
          )
        })}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:60 }}><span className="spinner" style={{width:28,height:28}}/></div>
      ) : (
        <div className="grid-3">
          {eventos.map(ev => (
            <div key={ev.id} className="card" style={{ position:'relative', cursor:'default' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
                <span style={{ fontSize:26 }}>{TIPO_EMOJI[ev.tipo] || '📅'}</span>
                <span className={`badge ${TIPO_BADGE[ev.tipo] || "badge-green"}`}>{TIPO_LABEL[ev.tipo] || ev.tipo}</span>
              </div>
              <h3 style={{ fontFamily:'var(--font-heading)', fontSize:16, fontWeight:600, marginBottom:6 }}>{ev.nombre}</h3>
              <div style={{ color:'var(--text-muted)', fontSize:12, marginBottom:4 }}>
                📅 {new Date(ev.fecha_inicio).toLocaleDateString('es-DO', { weekday:'short', year:'numeric', month:'short', day:'numeric' })}
              </div>
              {ev.lugar && <div style={{ color:'var(--text-muted)', fontSize:12, marginBottom:12 }}>📍 {ev.lugar}</div>}
              <div style={{ display:'flex', gap:8, marginTop:14, borderTop:'1px solid var(--border)', paddingTop:12 }}>
                <button className="btn btn-ghost" style={{ flex:1, justifyContent:'center', fontSize:12, padding:'6px' }} onClick={()=>loadAsistencia(ev)}>
                  Ver asistencia
                </button>
                {puedeEdit && <button className="btn btn-danger" style={{ padding:'6px 10px', fontSize:12 }} onClick={()=>handleDelete(ev.id)}>✕</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal === 'nuevo' && (
        <Modal title="Nuevo evento" onClose={()=>setModal(null)}>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={submitEvento} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div className="form-group">
              <label className="form-label">Nombre del evento *</label>
              <input value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} className="form-input" required />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Tipo</label>
                <select value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})} className="form-input">
                  {['culto','retiro','conferencia','boda','bautismo','celula','otro'].map(t=><option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Fecha y hora *</label>
                <DatePicker name="fecha_inicio" value={form.fecha_inicio} onChange={e=>setForm({...form,fecha_inicio:e.target.value})} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Lugar</label>
              <input value={form.lugar} onChange={e=>setForm({...form,lugar:e.target.value})} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Descripción</label>
              <textarea value={form.descripcion} onChange={e=>setForm({...form,descripcion:e.target.value})} className="form-input" rows={2} style={{ resize:'vertical' }} />
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={()=>setModal(null)}>Cancelar</button>
              <button type="submit" className="btn btn-gold" disabled={saving}>{saving?'Guardando...':'Crear evento'}</button>
            </div>
          </form>
        </Modal>
      )}

      {asistenciaEvento && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setAsistenciaEvento(null)}>
          <div className="modal" style={{ maxWidth:550 }}>
            <div className="modal-header">
              <h3 className="modal-title">Asistencia – {asistenciaEvento.nombre}</h3>
              <button className="modal-close" onClick={()=>setAsistenciaEvento(null)}>×</button>
            </div>

            {asistenciaData && (
              <div style={{ display:'flex', gap:16, marginBottom:20 }}>
                <div style={{ background:'var(--green-dim)', borderRadius:8, padding:'10px 20px', flex:1, textAlign:'center' }}>
                  <div style={{ fontSize:22, fontWeight:700, color:'var(--green)' }}>{asistenciaData.presentes}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>Presentes</div>
                </div>
                <div style={{ background:'var(--blue-dim)', borderRadius:8, padding:'10px 20px', flex:1, textAlign:'center' }}>
                  <div style={{ fontSize:22, fontWeight:700, color:'var(--blue)' }}>{asistenciaData.total_registros}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>Total</div>
                </div>
              </div>
            )}

            <form onSubmit={submitAsistencia} style={{ display:'flex', gap:10, marginBottom:18 }}>
              <input placeholder="Nombre de visita" value={asForm.nombre_visita} onChange={e=>setAsForm({...asForm,nombre_visita:e.target.value})} className="form-input" style={{ flex:2 }} required />
              <input placeholder="Tel\u00e9fono" value={asForm.telefono_visita} onChange={e=>setAsForm({...asForm,telefono_visita:e.target.value})} className="form-input" style={{ flex:1 }} />
              <button type="submit" className="btn btn-gold" disabled={saving} style={{ whiteSpace:'nowrap' }}>+ Agregar</button>
            </form>

            {!asistenciaData ? (
              <div style={{ textAlign:'center', padding:20 }}><span className="spinner" /></div>
            ) : asistenciaData.registros?.length === 0 ? (
              <div style={{ textAlign:'center', padding:20, color:'var(--text-muted)', fontSize:13 }}>Sin registros aún</div>
            ) : (
              <div style={{ maxHeight:250, overflowY:'auto' }}>
                {asistenciaData.registros.map((r, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                    <span style={{ fontWeight:500, fontSize:13 }}>{r.nombre_visita || 'Miembro registrado'}</span>
                    <span className={`badge ${r.presente ? "badge-green" : "badge-red"}`}>{r.presente ? "Presente" : "Ausente"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}






