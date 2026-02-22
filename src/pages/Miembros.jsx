import { useEffect, useState } from 'react'
import { getMiembros, createMiembro, updateMiembro, deleteMiembro } from '../api/client'

const ROL_BADGE = { pastor:'badge-gold', 'co-pastor':'badge-gold', diacono:'badge-blue', lider:'badge-blue', miembro:'badge-green', visitante:'badge-amber' }
const ESTADO_BADGE = { activo:'badge-green', inactivo:'badge-red', visita:'badge-amber', trasladado:'badge-blue' }

const EMPTY = { nombres:'', apellidos:'', cedula:'', telefono:'', email:'', genero:'', estado_civil:'', direccion:'', fecha_nacimiento:'', fecha_conversion:'', fecha_bautismo:'', tipo_bautismo:'', rol:'miembro', estado:'activo', notas:'' }

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
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

function MiembroForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const h = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      if (initial?.id) await updateMiembro(initial.id, form)
      else await createMiembro(form)
      onSave()
    } catch(err) {
      setError(err.response?.data?.detail || 'Error al guardar')
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit}>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="grid-2" style={{ gap:14 }}>
        <div className="form-group">
          <label className="form-label">Nombres *</label>
          <input name="nombres" value={form.nombres} onChange={h} className="form-input" required />
        </div>
        <div className="form-group">
          <label className="form-label">Apellidos *</label>
          <input name="apellidos" value={form.apellidos} onChange={h} className="form-input" required />
        </div>
        <div className="form-group">
          <label className="form-label">Cédula</label>
          <input name="cedula" value={form.cedula} onChange={h} className="form-input" />
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
          <label className="form-label">Fecha de nacimiento</label>
          <input name="fecha_nacimiento" type="date" value={form.fecha_nacimiento} onChange={h} className="form-input" />
        </div>
        <div className="form-group">
          <label className="form-label">Género</label>
          <select name="genero" value={form.genero} onChange={h} className="form-input">
            <option value="">— Seleccionar —</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
            <option value="O">Otro</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Estado civil</label>
          <select name="estado_civil" value={form.estado_civil} onChange={h} className="form-input">
            <option value="">— Seleccionar —</option>
            <option value="soltero">Soltero/a</option>
            <option value="casado">Casado/a</option>
            <option value="viudo">Viudo/a</option>
            <option value="divorciado">Divorciado/a</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Fecha de conversión</label>
          <input name="fecha_conversion" type="date" value={form.fecha_conversion} onChange={h} className="form-input" />
        </div>
        <div className="form-group">
          <label className="form-label">Fecha de bautismo</label>
          <input name="fecha_bautismo" type="date" value={form.fecha_bautismo} onChange={h} className="form-input" />
        </div>
        <div className="form-group">
          <label className="form-label">Rol</label>
          <select name="rol" value={form.rol} onChange={h} className="form-input">
            <option value="miembro">Miembro</option>
            <option value="lider">Líder</option>
            <option value="diacono">Diácono</option>
            <option value="co-pastor">Co-Pastor</option>
            <option value="pastor">Pastor</option>
            <option value="visitante">Visitante</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Estado</label>
          <select name="estado" value={form.estado} onChange={h} className="form-input">
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
            <option value="visita">Visita</option>
            <option value="trasladado">Trasladado</option>
          </select>
        </div>
      </div>
      <div className="form-group" style={{ marginTop:14 }}>
        <label className="form-label">Dirección</label>
        <input name="direccion" value={form.direccion} onChange={h} className="form-input" />
      </div>
      <div className="form-group" style={{ marginTop:14 }}>
        <label className="form-label">Notas</label>
        <textarea name="notas" value={form.notas} onChange={h} className="form-input" rows={2} style={{ resize:'vertical' }} />
      </div>
      <div style={{ display:'flex', gap:10, marginTop:22, justifyContent:'flex-end' }}>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn btn-gold" disabled={loading}>
          {loading ? 'Guardando...' : (initial?.id ? 'Actualizar' : 'Crear miembro')}
        </button>
      </div>
    </form>
  )
}

export default function Miembros() {
  const [miembros, setMiembros] = useState([])
  const [loading, setLoading] = useState(true)
  const [buscar, setBuscar] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [modal, setModal] = useState(null) // null | 'nuevo' | miembro
  const [confirmDel, setConfirmDel] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const params = { limit: 200 }
      if (filtroEstado) params.estado = filtroEstado
      if (buscar) params.buscar = buscar
      const { data } = await getMiembros(params)
      setMiembros(data)
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => { load() }, [filtroEstado, buscar])

  const handleDelete = async () => {
    try { await deleteMiembro(confirmDel); setConfirmDel(null); load() } catch (_) {}
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Miembros</h1>
          <p className="page-subtitle">{miembros.length} registros encontrados</p>
        </div>
        <button className="btn btn-gold" onClick={() => setModal('nuevo')}>+ Nuevo miembro</button>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <div className="search-bar">
          <span className="search-icon">⌕</span>
          <input placeholder="Buscar por nombre o cédula..." value={buscar} onChange={e => setBuscar(e.target.value)} />
        </div>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="form-input" style={{ width:'auto' }}>
          <option value="">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
          <option value="visita">Visitas</option>
          <option value="trasladado">Trasladados</option>
        </select>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Cédula</th>
                <th>Teléfono</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Bautismo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign:'center', padding:40 }}><span className="spinner" /></td></tr>
              ) : miembros.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign:'center', padding:30, color:'var(--text-muted)' }}>No se encontraron miembros</td></tr>
              ) : miembros.map(m => (
                <tr key={m.id}>
                  <td style={{ fontWeight:500 }}>{m.nombres} {m.apellidos}</td>
                  <td style={{ color:'var(--text-muted)', fontFamily:'monospace' }}>{m.cedula || '—'}</td>
                  <td>{m.telefono || '—'}</td>
                  <td style={{ color:'var(--text-muted)' }}>{m.email || '—'}</td>
                  <td><span className={`badge ${ROL_BADGE[m.rol] || 'badge-green'}`}>{m.rol}</span></td>
                  <td><span className={`badge ${ESTADO_BADGE[m.estado] || 'badge-green'}`}>{m.estado}</span></td>
                  <td style={{ color:'var(--text-muted)' }}>{m.fecha_bautismo ? new Date(m.fecha_bautismo).toLocaleDateString('es-DO') : '—'}</td>
                  <td>
                    <div style={{ display:'flex', gap:6 }}>
                      <button className="btn btn-ghost" style={{ padding:'5px 10px', fontSize:12 }} onClick={() => setModal(m)}>Editar</button>
                      <button className="btn btn-danger" style={{ padding:'5px 10px', fontSize:12 }} onClick={() => setConfirmDel(m.id)}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New/Edit Modal */}
      {modal && (
        <Modal title={modal === 'nuevo' ? 'Nuevo miembro' : `Editar: ${modal.nombres}`} onClose={() => setModal(null)}>
          <MiembroForm initial={modal === 'nuevo' ? null : modal} onSave={() => { setModal(null); load() }} onClose={() => setModal(null)} />
        </Modal>
      )}

      {/* Confirm delete */}
      {confirmDel && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth:380 }}>
            <div style={{ textAlign:'center', padding:'8px 0 20px' }}>
              <div style={{ fontSize:36, marginBottom:12 }}>⚠️</div>
              <h3 style={{ fontFamily:'var(--font-heading)', fontSize:18, marginBottom:8 }}>¿Eliminar miembro?</h3>
              <p style={{ color:'var(--text-muted)', fontSize:13 }}>Esta acción no se puede deshacer.</p>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-ghost" style={{ flex:1 }} onClick={() => setConfirmDel(null)}>Cancelar</button>
              <button className="btn btn-danger" style={{ flex:1, justifyContent:'center' }} onClick={handleDelete}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
