import { useEffect, useState } from 'react'
import { getMiembros, createMiembro, updateMiembro, deleteMiembro } from '../api/client'

const ROL_BADGE = { pastor:'badge-gold', 'co-pastor':'badge-gold', diacono:'badge-blue', lider:'badge-blue', miembro:'badge-green', visitante:'badge-amber' }
const ESTADO_BADGE = { activo:'badge-green', inactivo:'badge-red', visita:'badge-amber', trasladado:'badge-blue' }

const EMPTY = {
  nombres:'', apellidos:'', cedula:'', telefono:'', email:'', genero:'', estado_civil:'', direccion:'', fecha_nacimiento:'',
  fecha_conversion:'', fecha_bautismo:'', tipo_bautismo:'', rol:'miembro', estado:'activo', notas:'',
  nombre_conyuge:'', numero_hijos:'', telefono_emergencia:'', nombres_hijos:'',
  iglesia_bautismo:'', tiempo_en_iglesia:'', miembro_activo:'Si',
  ministerio_actual:'', ministerios_anteriores:'', dones_talentos:'', disponibilidad:'',
  visitas_pastorales:'No', consejeria_pastoral:'No', motivo_oracion:'', foto:''
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
          <button className="modal-close" onClick={onClose}>x</button>
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

  const handleFoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setForm(f => ({ ...f, foto: ev.target.result }))
    reader.readAsDataURL(file)
  }

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

      <Section title="Foto del miembro">
        <FullWidth>
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            {form.foto ? (
              <img src={form.foto} alt="Foto" style={{ width:90, height:90, borderRadius:'50%', objectFit:'cover', border:'3px solid var(--gold)' }} />
            ) : (
              <div style={{ width:90, height:90, borderRadius:'50%', background:'var(--bg-card)', border:'3px solid var(--gold)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36 }}>👤</div>
            )}
            <div>
              <label className="form-label">Subir foto</label>
              <input type="file" accept="image/*" onChange={handleFoto} className="form-input" />
            </div>
          </div>
        </FullWidth>
      </Section>

      <Section title="I. Informacion Personal">
        <Field label="Nombres *"><input name="nombres" value={form.nombres} onChange={h} className="form-input" required /></Field>
        <Field label="Apellidos *"><input name="apellidos" value={form.apellidos} onChange={h} className="form-input" required /></Field>
        <Field label="Cedula">{inp('cedula')}</Field>
        <Field label="Fecha de nacimiento">{inp('fecha_nacimiento','date')}</Field>
        <Field label="Telefono">{inp('telefono','tel')}</Field>
        <Field label="Correo electronico">{inp('email','email')}</Field>
        <Field label="Genero">{sel('genero',[['','-- Seleccionar --'],['M','Masculino'],['F','Femenino'],['O','Otro']])}</Field>
        <Field label="Estado civil">{sel('estado_civil',[['','-- Seleccionar --'],['soltero','Soltero/a'],['casado','Casado/a'],['viudo','Viudo/a'],['divorciado','Divorciado/a']])}</Field>
        <FullWidth><Field label="Direccion">{inp('direccion')}</Field></FullWidth>
      </Section>

      <Section title="II. Informacion Familiar">
        <Field label="Nombre del conyuge">{inp('nombre_conyuge')}</Field>
        <Field label="Numero de hijos">{inp('numero_hijos','number')}</Field>
        <Field label="Telefono de emergencia">{inp('telefono_emergencia','tel')}</Field>
        <FullWidth><Field label="Nombres y edades de los hijos">{ta('nombres_hijos',2)}</Field></FullWidth>
      </Section>

      <Section title="III. Informacion Espiritual">
        <Field label="Fecha de conversion">{inp('fecha_conversion','date')}</Field>
        <Field label="Fecha de bautismo">{inp('fecha_bautismo','date')}</Field>
        <Field label="Iglesia donde fue bautizado">{inp('iglesia_bautismo')}</Field>
        <Field label="Tiempo en esta iglesia">{inp('tiempo_en_iglesia','','Ej: 2 anos')}</Field>
        <Field label="Miembro activo">{sel('miembro_activo',[['Si','Si'],['No','No']])}</Field>
        <Field label="Rol">{sel('rol',[['miembro','Miembro'],['lider','Lider'],['diacono','Diacono'],['co-pastor','Co-Pastor'],['pastor','Pastor'],['visitante','Visitante']])}</Field>
        <Field label="Estado">{sel('estado',[['activo','Activo'],['inactivo','Inactivo'],['visita','Visita'],['trasladado','Trasladado']])}</Field>
      </Section>

      <Section title="IV. Servicio y Ministerio">
        <FullWidth><Field label="Ministerio actual">{inp('ministerio_actual')}</Field></FullWidth>
        <FullWidth><Field label="Ministerios anteriores">{ta('ministerios_anteriores',2)}</Field></FullWidth>
        <FullWidth><Field label="Dones o talentos">{ta('dones_talentos',2)}</Field></FullWidth>
        <FullWidth><Field label="Disponibilidad">{inp('disponibilidad','','Ej: Lunes y viernes, tarde')}</Field></FullWidth>
      </Section>

      <Section title="V. Cuidado Pastoral">
        <Field label="Visitas pastorales?">{sel('visitas_pastorales',[['Si','Si'],['No','No']])}</Field>
        <Field label="Consejeria pastoral?">{sel('consejeria_pastoral',[['Si','Si'],['No','No']])}</Field>
        <FullWidth><Field label="Motivo de oracion">{ta('motivo_oracion',2)}</Field></FullWidth>
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

  const imprimir = () => {
    const ventana = window.open('', '_blank')
    ventana.document.write(`
      <html>
      <head>
        <title>Ficha de Miembro - ${miembro.nombres} ${miembro.apellidos}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 30px; color: #000; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          h2 { font-size: 13px; color: #b8860b; text-transform: uppercase; letter-spacing: 1px; border-left: 3px solid #b8860b; padding-left: 8px; margin: 16px 0 8px; }
          .campo { margin-bottom: 6px; font-size: 13px; }
          .label { color: #666; }
          .header { display: flex; align-items: center; gap: 20px; margin-bottom: 20px; border-bottom: 2px solid #b8860b; padding-bottom: 16px; }
          .foto { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid #b8860b; }
          .foto-placeholder { width: 80px; height: 80px; border-radius: 50%; background: #eee; border: 2px solid #b8860b; display: flex; align-items: center; justify-content: center; font-size: 30px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
          .iglesia { font-size: 12px; color: #b8860b; font-weight: bold; }
          .versiculo { font-style: italic; font-size: 11px; color: #666; text-align: center; margin-top: 20px; border-top: 1px solid #ccc; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          ${miembro.foto ? `<img src="${miembro.foto}" class="foto" />` : '<div class="foto-placeholder">👤</div>'}
          <div>
            <p class="iglesia">Ministerio San Juan 7:38 - Del Semillero 1/11</p>
            <h1>${miembro.nombres} ${miembro.apellidos}</h1>
            <p style="margin:0; font-size:13px; color:#666;">${miembro.rol || ''} | ${miembro.estado || ''}</p>
          </div>
        </div>

        <h2>I. Informacion Personal</h2>
        <div class="grid">
          ${miembro.cedula ? `<div class="campo"><span class="label">Cedula: </span>${miembro.cedula}</div>` : ''}
          ${miembro.fecha_nacimiento ? `<div class="campo"><span class="label">Nacimiento: </span>${new Date(miembro.fecha_nacimiento).toLocaleDateString('es-DO')}</div>` : ''}
          ${miembro.telefono ? `<div class="campo"><span class="label">Telefono: </span>${miembro.telefono}</div>` : ''}
          ${miembro.email ? `<div class="campo"><span class="label">Email: </span>${miembro.email}</div>` : ''}
          ${miembro.genero ? `<div class="campo"><span class="label">Genero: </span>${miembro.genero === 'M' ? 'Masculino' : miembro.genero === 'F' ? 'Femenino' : miembro.genero}</div>` : ''}
          ${miembro.estado_civil ? `<div class="campo"><span class="label">Estado civil: </span>${miembro.estado_civil}</div>` : ''}
        </div>
        ${miembro.direccion ? `<div class="campo"><span class="label">Direccion: </span>${miembro.direccion}</div>` : ''}

        <h2>II. Informacion Familiar</h2>
        <div class="grid">
          ${miembro.nombre_conyuge ? `<div class="campo"><span class="label">Conyuge: </span>${miembro.nombre_conyuge}</div>` : ''}
          ${miembro.numero_hijos ? `<div class="campo"><span class="label">Hijos: </span>${miembro.numero_hijos}</div>` : ''}
          ${miembro.telefono_emergencia ? `<div class="campo"><span class="label">Tel. emergencia: </span>${miembro.telefono_emergencia}</div>` : ''}
        </div>
        ${miembro.nombres_hijos ? `<div class="campo"><span class="label">Nombres de hijos: </span>${miembro.nombres_hijos}</div>` : ''}

        <h2>III. Informacion Espiritual</h2>
        <div class="grid">
          ${miembro.fecha_conversion ? `<div class="campo"><span class="label">Conversion: </span>${new Date(miembro.fecha_conversion).toLocaleDateString('es-DO')}</div>` : ''}
          ${miembro.fecha_bautismo ? `<div class="campo"><span class="label">Bautismo: </span>${new Date(miembro.fecha_bautismo).toLocaleDateString('es-DO')}</div>` : ''}
          ${miembro.iglesia_bautismo ? `<div class="campo"><span class="label">Iglesia bautismo: </span>${miembro.iglesia_bautismo}</div>` : ''}
          ${miembro.tiempo_en_iglesia ? `<div class="campo"><span class="label">Tiempo en iglesia: </span>${miembro.tiempo_en_iglesia}</div>` : ''}
          ${miembro.miembro_activo ? `<div class="campo"><span class="label">Miembro activo: </span>${miembro.miembro_activo}</div>` : ''}
        </div>

        <h2>IV. Servicio y Ministerio</h2>
        ${miembro.ministerio_actual ? `<div class="campo"><span class="label">Ministerio actual: </span>${miembro.ministerio_actual}</div>` : ''}
        ${miembro.ministerios_anteriores ? `<div class="campo"><span class="label">Ministerios anteriores: </span>${miembro.ministerios_anteriores}</div>` : ''}
        ${miembro.dones_talentos ? `<div class="campo"><span class="label">Dones y talentos: </span>${miembro.dones_talentos}</div>` : ''}
        ${miembro.disponibilidad ? `<div class="campo"><span class="label">Disponibilidad: </span>${miembro.disponibilidad}</div>` : ''}

        <h2>V. Cuidado Pastoral</h2>
        <div class="grid">
          ${miembro.visitas_pastorales ? `<div class="campo"><span class="label">Visitas pastorales: </span>${miembro.visitas_pastorales}</div>` : ''}
          ${miembro.consejeria_pastoral ? `<div class="campo"><span class="label">Consejeria: </span>${miembro.consejeria_pastoral}</div>` : ''}
        </div>
        ${miembro.motivo_oracion ? `<div class="campo"><span class="label">Motivo de oracion: </span>${miembro.motivo_oracion}</div>` : ''}
        ${miembro.notas ? `<div class="campo"><span class="label">Notas: </span>${miembro.notas}</div>` : ''}

        <div class="versiculo">"El que cree en mi, como dice la Escritura, de su interior correran rios de agua viva." — Juan 7:38</div>
      </body>
      </html>
    `)
    ventana.document.close()
    ventana.print()
  }

  return (
    <Modal title={`${miembro.nombres} ${miembro.apellidos}`} onClose={onClose}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16, gap:10, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          {miembro.foto ? (
            <img src={miembro.foto} alt="Foto" style={{ width:70, height:70, borderRadius:'50%', objectFit:'cover', border:'3px solid var(--gold)' }} />
          ) : (
            <div style={{ width:70, height:70, borderRadius:'50%', background:'var(--bg-card)', border:'3px solid var(--gold)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:30 }}>👤</div>
          )}
          <div>
            <div style={{ fontWeight:700, fontSize:18 }}>{miembro.nombres} {miembro.apellidos}</div>
            <div style={{ color:'var(--gold)', fontSize:13 }}>{miembro.rol} | {miembro.estado}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-ghost" style={{ fontSize:13, padding:'5px 14px' }} onClick={imprimir}>Imprimir ficha</button>
          <button className="btn btn-gold" style={{ fontSize:13, padding:'5px 14px' }} onClick={onEdit}>Editar</button>
        </div>
      </div>

      {seccion('I. Informacion Personal', <>
        {campo('Cedula', miembro.cedula)}
        {campo('Fecha de nacimiento', miembro.fecha_nacimiento ? new Date(miembro.fecha_nacimiento).toLocaleDateString('es-DO') : null)}
        {campo('Telefono', miembro.telefono)}
        {campo('Correo', miembro.email)}
        {campo('Genero', miembro.genero === 'M' ? 'Masculino' : miembro.genero === 'F' ? 'Femenino' : miembro.genero)}
        {campo('Estado civil', miembro.estado_civil)}
        {campo('Direccion', miembro.direccion)}
      </>)}
      {seccion('II. Informacion Familiar', <>
        {campo('Conyuge', miembro.nombre_conyuge)}
        {campo('Numero de hijos', miembro.numero_hijos)}
        {campo('Telefono de emergencia', miembro.telefono_emergencia)}
        {campo('Hijos', miembro.nombres_hijos)}
      </>)}
      {seccion('III. Informacion Espiritual', <>
        {campo('Fecha de conversion', miembro.fecha_conversion ? new Date(miembro.fecha_conversion).toLocaleDateString('es-DO') : null)}
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
        {campo('Consejeria pastoral', miembro.consejeria_pastoral)}
        {campo('Motivo de oracion', miembro.motivo_oracion)}
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
          <input placeholder="Buscar por nombre o cedula..." value={buscar} onChange={e => setBuscar(e.target.value)} />
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
                <th>Foto</th>
                <th>Nombre</th>
                <th>Cedula</th>
                <th>Telefono</th>
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
                <tr key={m.id} style={{ cursor:'pointer' }} onClick={() => setPerfil(m)}>
                  <td>
                    {m.foto ? (
                      <img src={m.foto} alt="Foto" style={{ width:36, height:36, borderRadius:'50%', objectFit:'cover', border:'2px solid var(--gold)' }} />
                    ) : (
                      <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--bg-card)', border:'2px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>👤</div>
                    )}
                  </td>
                  <td style={{ fontWeight:500 }}>{m.nombres} {m.apellidos}</td>
                  <td style={{ color:'var(--text-muted)', fontFamily:'monospace' }}>{m.cedula || '—'}</td>
                  <td>{m.telefono || '—'}</td>
                  <td><span className={`badge ${ROL_BADGE[m.rol] || 'badge-green'}`}>{m.rol}</span></td>
                  <td><span className={`badge ${ESTADO_BADGE[m.estado] || 'badge-green'}`}>{m.estado}</span></td>
                  <td style={{ color:'var(--text-muted)' }}>{m.fecha_bautismo ? new Date(m.fecha_bautismo).toLocaleDateString('es-DO') : '—'}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{ display:'flex', gap:6 }}>
                      <button className="btn btn-ghost" style={{ padding:'5px 10px', fontSize:12 }} onClick={() => setModal(m)}>Editar</button>
                      <button className="btn btn-danger" style={{ padding:'5px 10px', fontSize:12 }} onClick={() => setConfirmDel(m.id)}>x</button>
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
              <h3 style={{ fontFamily:'var(--font-heading)', fontSize:18, marginBottom:8 }}>Eliminar miembro?</h3>
              <p style={{ color:'var(--text-muted)', fontSize:13 }}>Esta accion no se puede deshacer.</p>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-ghost" style={{ flex:1 }} onClick={() => setConfirmDel(null)}>Cancelar</button>
              <button className="btn btn-danger" style={{ flex:1, justifyContent:'center' }} onClick={handleDelete}>Si, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
