import { useEffect, useState } from 'react'
import { getMiembros, createMiembro, updateMiembro, deleteMiembro } from '../api/client'

const ROL_BADGE = { pastor:'badge-gold', 'co-pastor':'badge-gold', diacono:'badge-blue', lider:'badge-blue', miembro:'badge-green', visitante:'badge-amber' }
const ESTADO_BADGE = { activo:'badge-green', inactivo:'badge-red', visita:'badge-amber', trasladado:'badge-blue' }

const EMPTY = {
  nombres:'', apellidos:'', cedula:'', telefono:'', email:'', genero:'', estado_civil:'', direccion:'', fecha_nacimiento:'',
  fecha_conversion:'', fecha_bautismo:'', tipo_bautismo:'', rol:'miembro', estado:'activo', notas:'',
  // Familiar
  nombre_conyuge:'', numero_hijos:'', telefono_emergencia:'', nombres_hijos:'',
  // Espiritual
  iglesia_bautismo:'', tiempo_en_iglesia:'', miembro_activo:'Si',
  // Ministerio
  ministerio_actual:'', ministerios_anteriores:'', dones_talentos:'', disponibilidad:'',
  // Pastoral
  visitas_pastorales:'No', consejeria_pastoral:'No', motivo_oracion:''
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ background:'var(--bg-card)', borderLeft:'3px solid var(--gold)', padding:'6px 12px', marginBottom:12, borderRadius:'0 6px 6px 0' }}>
        <span style={{ fontFamily:'var(--font-heading)', fontWeight:700, fontSize:13, color:'var(--gold)', textTransform:'uppercase', letterSpacing:1 }}>{title}</span>
      </div>
      <div className="grid-2" style={{ gap:12 }}>{children}</div>
    </div>
  )
}

function FullWidth({ children }) {
  return <div style={{ gridColumn:'1 / -1' }}>{children}</div>
}

function Field({ label, children }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {children}
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth:700, width:'95%' }}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div style={{ maxHeight:'80vh', overflowY:'auto', padding:'4px 2px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function MiembroForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial ? { ...EMPTY, ...initial } : EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const h = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const payload = { ...form }
      if (!payload.fecha_nacimiento) delete payload.fecha_nacimiento
      if (!payload.fecha_conversion) delete payload.fecha_conversion
      if (!payload.fecha_bautismo) delete payload.fecha_bautismo
      if (initial?.id) await updateMiembro(initial.id, payload)
      else await createMiembro(payload)
      onSave()
    } catch(err) {
      setError(err.response?.data?.detail || 'Error al guardar')
    } finally { setLoading(false) }
  }

  const inp = (name, type='text', placeholder='') => (
    <input name={name} type={type} value={form[name]||''} onChange={h} className="form-input" placeholder={placeholder} />
  )
  const sel = (name, options) => (
    <select name={name} value={form[name]||''} onChange={h} className="form-input">
      {options.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  )
  const ta = (name, rows=2) => (
    <textarea name={name} value={form[name]||''} onChange={h} className="form-input" rows={rows} style={{ resize:'vertical' }} />
  )

  return (
    <form onSubmit={submit}>
      {error && <div className="alert alert-error">{error}</div>}

      <Section title="I. Información Personal">
        <Field label="Nombres *"><input name="nombres" value={form.nombres} onChange={h} className="form-input" required /></Field>
        <Field label="Apellidos *"><input name="apellidos" value={form.apellidos} onChange={h} className="form-input" required /></Field>
        <Field label="Cédula">{inp('cedula')}</Field>
        <Field label="Fecha de nacimiento">{inp('fecha_nacimiento','date')}</Field>
        <Field label="Teléfono">{inp('telefono','tel')}</Field>
        <Field label="Correo electrónico">{inp('email','email')}</Field>
        <Field label="Género">{sel('genero',[['','— Seleccionar —'],['M','Masculino'],['F','Femenino'],['O','Otro']])}</Field>
        <Field label="Estado civil">{sel('estado_civil',[['','— Seleccionar —'],['soltero','Soltero/a'],['casado','Casado/a'],['viudo','Viudo/a'],['divorciado','Divorciado/a']])}</Field>
        <FullWidth><Field label="Dirección">{inp('direccion')}</Field></FullWidth>
      </Section>

      <Section title="II. Información Familiar">
        <Field label="Nombre del cónyuge">{inp('nombre_conyuge')}</Field>
        <Field label="Número de hijos">{inp('numero_hijos','number')}</Field>
        <Field label="Teléfono de emergencia">{inp('telefono_emergencia','tel')}</Field>
        <FullWidth><Field label="Nombres y edades de los hijos">{ta('nombres_hijos',2)}</Field></FullWidth>
      </Section>

      <Section title="III. Información Espiritual">
        <Field label="Fecha de conversión">{inp('fecha_conversion','date')}</Field>
        <Field label="Fecha de bautismo">{inp('fecha_bautismo','date')}</Field>
        <Field label="Iglesia donde fue bautizado">{inp('iglesia_bautismo')}</Field>
        <Field label="Tiempo en esta iglesia">{inp('tiempo_en_iglesia','',  'Ej: 2 años')}</Field>
        <Field label="Miembro activo">{sel('miembro_activo',[['Si','Sí'],['No','No']])}</Field>
        <Field label="Rol">{sel('rol',[['miembro','Miembro'],['lider','Líder'],['diacono','Diácono'],['co-pastor','Co-Pastor'],['pastor','Pastor'],['visitante','Visitante']])}</Field>
        <Field label="Estado">{sel('estado',[['activo','Activo'],['inactivo','Inactivo'],['visita','Visita'],['trasladado','Trasladado']])}</Field>
      </Section>

      <Section title="IV. Servicio y Ministerio">
        <FullWidth><Field label="Ministerio actual">{inp('ministerio_actual')}</Field></FullWidth>
        <FullWidth><Field label="Ministerios anteriores">{ta('ministerios_anteriores',2)}</Field></FullWidth>
        <FullWidth><Field label="Dones o talentos">{ta('dones_talentos',2)}</Field></FullWidth>
        <FullWidth><Field label="Disponibilidad (días / horarios)">{inp('disponibilidad','','Ej: Lunes y viernes, tarde')}</Field></FullWidth>
      </Section>

      <Section title="V. Cuidado Pastoral">
        <Field label="¿Desea visitas pastorales?">{sel('visitas_pastorales',[['Si','Sí'],['No','No']])}</Field>
        <Field label="¿Consejería pastoral?">{sel('consejeria_pastoral',[['Si','Sí'],['No','No']])}</Field>
        <FullWidth><Field label="Motivo de oración">{ta('motivo_oracion',2)}</Field></FullWidth>
        <FullWidth><Field label="Notas adicionales">{ta('notas',2)}</Field></FullWidth>
      </Section>

      <div style={{ display:'flex', gap:10, marginTop:10, justifyContent:'flex-end' }}>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn btn-gold" disabled={loading}>
          {loading ? 'Guardando...' : (initial?.id ? 'Actualizar' : 'Crear miembro')}
        </button>
      </div>
    </form>
  )
}

function PerfilModal({ miembro, onClose, onEdit }) {
  const campo = (label, value) => value ? (
    <div style={{ marginBottom:8 }}>
      <span style={{ color:'var(--text-muted)', fontSize:12 }}>{label}: </span>
      <span style={{ fontWeight:500 }}>{value}</span>
    </div>
  ) : null

  const seccion = (titulo, campos) => (
    <div style={{ marginBottom:16 }}>
      <div style={{ background:'var(--bg-card)', borderLeft:'3px solid var(--gold)', padding:'5px 10px', marginBottom:10, borderRadius:'0 6px 6px 0' }}>
        <span style={{ fontFamily:'var(--font-heading)', fontWeight:700, fontSize:12, color:'var(--gold)', textTransform:'uppercase', letterSpacing:1 }}>{titulo}</span>
      </div>
      <div style={{ paddingLeft:8 }}>{campos}</div>
    </div>
  )

  return (
    <Modal title={`${miembro.nombres} ${miembro.apellidos}`} onClose={onClose}>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
        <button className="btn btn-gold" style={{ fontSize:13, padding:'5px 14px' }} onClick={onEdit}>✏️ Editar</button>
      </div>
      {seccion('I. Información Personal', <>
        {campo('Cédula', miembro.cedula)}
        {campo('Fecha de nacimiento', miembro.fecha_nacimiento ? new Date(miembro.fecha_nacimiento).toLocaleDateString('es-DO') : null)}
        {campo('Teléfono', miembro.telefono)}
        {campo('Correo', miembro.email)}
        {campo('Género', miembro.genero === 'M' ? 'Masculino' : miembro.genero === 'F' ? 'Femenino' : miembro.genero)}
        {campo('Estado civil', miembro.estado_civil)}
        {campo('Dirección', miembro.direccion)}
      </>)}
      {seccion('II. Información Familiar', <>
        {campo('Cónyuge', miembro.nombre_conyuge)}
        {campo('Número de hijos', miembro.numero_hijos)}
        {campo('Teléfono de emergencia', miembro.telefono_emergencia)}
        {campo('Hijos', miembro.nombres_hijos)}
      </>)}
      {seccion('III. Información Espiritual', <>
        {campo('Fecha de conversión', miembro.fecha_conversion ? new Date(miembro.fecha_conversion).toLocaleDateString('es-DO') : null)}
        {campo('Fecha de bautismo', miembro.fecha_bautismo ? new Date(miembro.fecha_bautismo).toLocaleDateString('es-DO') : null)}
        {campo('Iglesia de bautismo', miembro.iglesia_bautismo)}
        {campo('Tiempo en la iglesia', miembro.tiempo_en_iglesia)}
        {campo('Miembro activo', miembro.miembro_activo)}
        {campo('Rol', miembro.rol)}
        {campo('Estado', miembro.estado)}
      </>)}
      {seccion('IV. Servicio y Ministerio', <>
        {campo('Ministerio actual', miembro.ministerio_actual)}
        {campo('Ministerios anteriores', miembro.ministerios_anteriores)}
        {campo('Dones o talentos', miembro.dones_talentos)}
        {campo('Disponibilidad', miembro.disponibilidad)}
      </>)}
      {seccion('V. Cuidado Pastoral', <>
        {campo('Visitas pastorales', miembro.visitas_pastorales)}
        {campo('Consejería pastoral', miembro.consejeria_pastoral)}
        {campo('Motivo de oración', miembro.motivo_oracion)}
        {campo('Notas', miembro.notas)}
      </>)}
    </Modal>
  )
}

export default function Miembros() {
  const [miembros, setMiembros] = useState([])
  const [loading, setLoading] = useState(true)
  const [buscar, setBuscar] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [modal, setModal] = useState(null)
  const [perfil, setPerfil] = useState(null)
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
                <th>Rol</th>
                <th>Estado</th>
                <th>Bautismo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign:'center', padding:40 }}><span className="spinner" /></td></tr>
              ) : miembros.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign:'center', padding:30, color:'var(--text-muted)' }}>No se encontraron miembros</td></tr>
              ) : miembros.map(m => (
                <tr key={m.id} style={{ cursor:'pointer' }} onClick={() => setPerfil(m)}>
                  <td style={{ fontWeight:500 }}>{m.nombres} {m.apellidos}</td>
                  <td style={{ color:'var(--text-muted)', fontFamily:'monospace' }}>{m.cedula || '—'}</td>
                  <td>{m.telefono || '—'}</td>
                  <td><span className={`badge ${ROL_BADGE[m.rol] || 'badge-green'}`}>{m.rol}</span></td>
                  <td><span className={`badge ${ESTADO_BADGE[m.estado] || 'badge-green'}`}>{m.estado}</span></td>
                  <td style={{ color:'var(--text-muted)' }}>{m.fecha_bautismo ? new Date(m.fecha_bautismo).toLocaleDateString('es-DO') : '—'}</td>
                  <td onClick={e => e.stopPropagation()}>
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

      {perfil && !modal && (
        <PerfilModal miembro={perfil} onClose={() => setPerfil(null)} onEdit={() => { setModal(perfil); setPerfil(null) }} />
      )}

      {modal && (
        <Modal title={modal === 'nuevo' ? 'Nuevo miembro' : `Editar: ${modal.nombres}`} onClose={() => setModal(null)}>
          <MiembroForm initial={modal === 'nuevo' ? null : modal} onSave={() => { setModal(null); load() }} onClose={() => setModal(null)} />
        </Modal>
      )}

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
