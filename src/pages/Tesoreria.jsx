import { useEffect, useState } from 'react'
import { getIngresos, createIngreso, deleteIngreso, getGastos, createGasto, deleteGasto, getCategoriasIngreso, getCategoriasGasto, getResumenDiezmos, getMiembros } from '../api/client'

const fmt = (n) => new Intl.NumberFormat('es-DO', { style:'currency', currency:'DOP', maximumFractionDigits:0 }).format(n)

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

export default function Tesoreria() {
  const [tab, setTab] = useState('ingresos')
  const [ingresos, setIngresos] = useState([])
  const [gastos, setGastos] = useState([])
  const [catIng, setCatIng] = useState([])
  const [catGas, setCatGas] = useState([])
  const [diezmos, setDiezmos] = useState([])
  const [miembros, setMiembros] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const anio = new Date().getFullYear()
  const hoy = new Date().toISOString().split('T')[0]

  // Formulario ingreso general
  const [formIng, setFormIng] = useState({ categoria_id:'', monto:'', fecha: hoy, descripcion:'' })
  // Formulario gasto
  const [formGas, setFormGas] = useState({ categoria_id:'', monto:'', fecha: hoy, descripcion:'', beneficiario:'' })
  // Diezmos del dia
  const [diezmosDia, setDiezmosDia] = useState([])
  const [formDiezmo, setFormDiezmo] = useState({ miembro_id:'', monto:'', fecha: hoy })
  // Ofrendas del dia
  const [ofrendasDia, setOfrendasDia] = useState([])
  const [formOfrenda, setFormOfrenda] = useState({ monto:'', fecha: hoy, descripcion:'' })

  const totalDiezmosDia = diezmosDia.reduce((a,b) => a + parseFloat(b.monto||0), 0)
  const diezmoDeDiezmo = totalDiezmosDia * 0.1
  const totalOfrendasDia = ofrendasDia.reduce((a,b) => a + parseFloat(b.monto||0), 0)
  const diezmoDeOfrenda = totalOfrendasDia * 0.1

  const loadData = async () => {
    setLoading(true)
    try {
      const [i, g, ci, cg, d, m] = await Promise.allSettled([
        getIngresos({ limit:200 }), getGastos({ limit:200 }),
        getCategoriasIngreso(), getCategoriasGasto(),
        getResumenDiezmos(anio), getMiembros({ limit:200 })
      ])
      if (i.status==='fulfilled') setIngresos(i.value.data)
      if (g.status==='fulfilled') setGastos(g.value.data)
      if (ci.status==='fulfilled') setCatIng(ci.value.data)
      if (cg.status==='fulfilled') setCatGas(cg.value.data)
      if (d.status==='fulfilled') setDiezmos(d.value.data)
      if (m.status==='fulfilled') setMiembros(m.value.data)
    } catch(_) {}
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const totalIng = ingresos.reduce((a,b) => a + parseFloat(b.monto), 0)
  const totalGas = gastos.reduce((a,b) => a + parseFloat(b.monto), 0)

  const getCatId = (nombre) => catIng.find(c => c.nombre === nombre)?.id

  // Agregar diezmo a la lista del dia (sin guardar aun)
  const agregarDiezmo = (e) => {
    e.preventDefault()
    if (!formDiezmo.miembro_id || !formDiezmo.monto) return
    const miembro = miembros.find(m => m.id === formDiezmo.miembro_id)
    setDiezmosDia([...diezmosDia, { ...formDiezmo, nombre: `${miembro?.nombres} ${miembro?.apellidos}` }])
    setFormDiezmo({ miembro_id:'', monto:'', fecha: hoy })
  }

  // Guardar todos los diezmos del dia en ingresos
  const guardarDiezmos = async () => {
    if (diezmosDia.length === 0) return
    setSaving(true); setError('')
    const catId = getCatId('Diezmo')
    if (!catId) { setError('No existe categoría Diezmo'); setSaving(false); return }
    try {
      for (const d of diezmosDia) {
        await createIngreso({ categoria_id: catId, monto: parseFloat(d.monto), fecha: d.fecha, descripcion: 'Diezmo', miembro_id: d.miembro_id })
      }
      await loadData()
      setDiezmosDia([])
      alert(`✅ Diezmos guardados. Total: ${fmt(totalDiezmosDia)} | Diezmo de diezmo: ${fmt(diezmoDeDiezmo)}`)
    } catch(err) { setError(err.response?.data?.detail || 'Error al guardar') }
    setSaving(false)
  }

  // Agregar ofrenda a la lista del dia
  const agregarOfrenda = (e) => {
    e.preventDefault()
    if (!formOfrenda.monto) return
    setOfrendasDia([...ofrendasDia, { ...formOfrenda }])
    setFormOfrenda({ monto:'', fecha: hoy, descripcion:'' })
  }

  // Guardar todas las ofrendas del dia en ingresos
  const guardarOfrendas = async () => {
    if (ofrendasDia.length === 0) return
    setSaving(true); setError('')
    const catId = getCatId('Ofrenda')
    if (!catId) { setError('No existe categoría Ofrenda'); setSaving(false); return }
    try {
      for (const o of ofrendasDia) {
        await createIngreso({ categoria_id: catId, monto: parseFloat(o.monto), fecha: o.fecha, descripcion: o.descripcion || 'Ofrenda' })
      }
      await loadData()
      setOfrendasDia([])
      alert(`✅ Ofrendas guardadas. Total: ${fmt(totalOfrendasDia)} | Diezmo de ofrenda: ${fmt(diezmoDeOfrenda)}`)
    } catch(err) { setError(err.response?.data?.detail || 'Error al guardar') }
    setSaving(false)
  }

  const submitIngreso = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const payload = { ...formIng, categoria_id: parseInt(formIng.categoria_id), monto: parseFloat(formIng.monto) }
      await createIngreso(payload)
      await loadData()
      setModal(null)
      setFormIng({ categoria_id:'', monto:'', fecha: hoy, descripcion:'' })
    } catch(err) { setError(err.response?.data?.detail || 'Error') }
    setSaving(false)
  }

  const submitGasto = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await createGasto({ ...formGas, categoria_id: parseInt(formGas.categoria_id), monto: parseFloat(formGas.monto) })
      await loadData()
      setModal(null)
      setFormGas({ categoria_id:'', monto:'', fecha: hoy, descripcion:'', beneficiario:'' })
    } catch(err) { setError(err.response?.data?.detail || 'Error') }
    setSaving(false)
  }

  const eliminarIngreso = async (id) => {
    if (!confirm('¿Seguro que deseas eliminar este ingreso?')) return
    try { await deleteIngreso(id); await loadData() }
    catch(err) { alert(err.response?.data?.detail || 'Error al eliminar') }
  }

  const eliminarGasto = async (id) => {
    if (!confirm('¿Seguro que deseas eliminar este gasto?')) return
    try { await deleteGasto(id); await loadData() }
    catch(err) { alert(err.response?.data?.detail || 'Error al eliminar') }
  }

  const tabs = [
    { id:'ingresos', label:'Ingresos' },
    { id:'gastos', label:'Gastos' },
    { id:'diezmos', label:'Diezmos' },
    { id:'ofrendas', label:'Ofrendas' },
  ]

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tesorería</h1>
          <p className="page-subtitle">Control financiero de la iglesia</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn btn-ghost" onClick={() => setModal('gasto')}>+ Registrar gasto</button>
          <button className="btn btn-gold" onClick={() => setModal('ingreso')}>+ Registrar ingreso</button>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom:24 }}>
        <div className="stat-card">
          <div className="stat-icon">↑</div>
          <div className="stat-value text-green" style={{ fontSize:24 }}>{fmt(totalIng)}</div>
          <div className="stat-label">Total ingresos</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">↓</div>
          <div className="stat-value text-red" style={{ fontSize:24 }}>{fmt(totalGas)}</div>
          <div className="stat-label">Total gastos</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">◎</div>
          <div className="stat-value" style={{ fontSize:24, color: (totalIng-totalGas)>=0?'var(--green)':'var(--red)' }}>
            {fmt(totalIng - totalGas)}
          </div>
          <div className="stat-label">Balance</div>
        </div>
      </div>

      <div style={{ display:'flex', gap:4, marginBottom:20, borderBottom:'1px solid var(--border)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ background:'none', border:'none', cursor:'pointer', padding:'8px 18px',
              color: tab===t.id ? 'var(--gold)' : 'var(--text-muted)',
              borderBottom: tab===t.id ? '2px solid var(--gold)' : '2px solid transparent',
              fontSize:14, fontWeight:500, transition:'all 0.2s', fontFamily:'var(--font-body)'
            }}
          >{t.label}</button>
        ))}
      </div>

      {tab === 'ingresos' && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Fecha</th><th>Categoría</th><th>Monto</th><th>Descripción</th><th>Acciones</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={5} style={{ textAlign:'center', padding:40 }}><span className="spinner" /></td></tr>
                : ingresos.map(i => (
                  <tr key={i.id}>
                    <td style={{ color:'var(--text-muted)' }}>{new Date(i.fecha).toLocaleDateString('es-DO')}</td>
                    <td><span className="badge badge-green">{catIng.find(c=>c.id===i.categoria_id)?.nombre || i.categoria_id}</span></td>
                    <td style={{ fontWeight:600, color:'var(--green)' }}>{fmt(i.monto)}</td>
                    <td style={{ color:'var(--text-muted)' }}>{i.descripcion || '—'}</td>
                    <td>
                      <button onClick={() => eliminarIngreso(i.id)}
                        style={{ background:'none', border:'none', cursor:'pointer', color:'var(--red)', fontSize:13, padding:'2px 8px' }}>
                        🗑 Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'gastos' && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Fecha</th><th>Categoría</th><th>Monto</th><th>Descripción</th><th>Beneficiario</th><th>Acciones</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={6} style={{ textAlign:'center', padding:40 }}><span className="spinner" /></td></tr>
                : gastos.map(g => (
                  <tr key={g.id}>
                    <td style={{ color:'var(--text-muted)' }}>{new Date(g.fecha).toLocaleDateString('es-DO')}</td>
                    <td><span className="badge badge-red">{catGas.find(c=>c.id===g.categoria_id)?.nombre || g.categoria_id}</span></td>
                    <td style={{ fontWeight:600, color:'var(--red)' }}>{fmt(g.monto)}</td>
                    <td>{g.descripcion}</td>
                    <td style={{ color:'var(--text-muted)' }}>{g.beneficiario || '—'}</td>
                    <td>
                      <button onClick={() => eliminarGasto(g.id)}
                        style={{ background:'none', border:'none', cursor:'pointer', color:'var(--red)', fontSize:13, padding:'2px 8px' }}>
                        🗑 Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'diezmos' && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div className="card">
            <h3 style={{ fontFamily:'var(--font-heading)', fontSize:16, fontWeight:600, marginBottom:16 }}>Registrar diezmos del día</h3>
            <form onSubmit={agregarDiezmo} style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'flex-end' }}>
              <div className="form-group" style={{ flex:2, minWidth:180 }}>
                <label className="form-label">Miembro</label>
                <select value={formDiezmo.miembro_id} onChange={e=>setFormDiezmo({...formDiezmo,miembro_id:e.target.value})} className="form-input" required>
                  <option value="">— Seleccionar —</option>
                  {miembros.map(m=><option key={m.id} value={m.id}>{m.nombres} {m.apellidos}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ flex:1, minWidth:120 }}>
                <label className="form-label">Monto (DOP)</label>
                <input type="number" value={formDiezmo.monto} onChange={e=>setFormDiezmo({...formDiezmo,monto:e.target.value})} className="form-input" min="1" step="0.01" required />
              </div>
              <div className="form-group" style={{ flex:1, minWidth:140 }}>
                <label className="form-label">Fecha</label>
                <input type="date" value={formDiezmo.fecha} onChange={e=>setFormDiezmo({...formDiezmo,fecha:e.target.value})} className="form-input" required />
              </div>
              <button type="submit" className="btn btn-gold" style={{ marginBottom:4 }}>+ Agregar</button>
            </form>

            {diezmosDia.length > 0 && (
              <div style={{ marginTop:16 }}>
                <table>
                  <thead><tr><th>Miembro</th><th>Monto</th><th>Fecha</th><th></th></tr></thead>
                  <tbody>
                    {diezmosDia.map((d,i) => (
                      <tr key={i}>
                        <td>{d.nombre}</td>
                        <td style={{ color:'var(--gold)', fontWeight:600 }}>{fmt(d.monto)}</td>
                        <td style={{ color:'var(--text-muted)' }}>{d.fecha}</td>
                        <td><button onClick={()=>setDiezmosDia(diezmosDia.filter((_,j)=>j!==i))} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--red)' }}>✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop:16, background:'var(--bg-card)', border:'1px solid var(--gold)', borderRadius:8, padding:'12px 16px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontWeight:600 }}>Total diezmos del día:</span>
                    <span style={{ color:'var(--gold)', fontWeight:700, fontSize:18 }}>{fmt(totalDiezmosDia)}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                    <span style={{ fontWeight:600 }}>Diezmo de diezmo (10%):</span>
                    <span style={{ color:'var(--green)', fontWeight:700, fontSize:18 }}>{fmt(diezmoDeDiezmo)}</span>
                  </div>
                  {error && <div className="alert alert-error" style={{ marginBottom:10 }}>{error}</div>}
                  <button onClick={guardarDiezmos} className="btn btn-gold" disabled={saving} style={{ width:'100%' }}>
                    {saving ? 'Guardando...' : '💾 Guardar todos los diezmos en Ingresos'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <h3 style={{ fontFamily:'var(--font-heading)', fontSize:16, fontWeight:600, marginBottom:12 }}>Diezmos por miembro — {anio}</h3>
            <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Miembro</th><th>Total diezmado</th><th>Diezmo de diezmo (10%)</th><th>Pagos</th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={5} style={{ textAlign:'center', padding:40 }}><span className="spinner" /></td></tr>
                  : diezmos.length === 0
                    ? <tr><td colSpan={5} style={{ textAlign:'center', padding:30, color:'var(--text-muted)' }}>Sin registros</td></tr>
                    : diezmos.map((d,i) => (
                      <tr key={i}>
                        <td style={{ color:'var(--text-muted)' }}>{i+1}</td>
                        <td style={{ fontWeight:500 }}>{d.miembro}</td>
                        <td style={{ fontWeight:600, color:'var(--gold)' }}>{fmt(d.total)}</td>
                        <td style={{ fontWeight:600, color:'var(--green)' }}>{fmt(d.total * 0.1)}</td>
                        <td><span className="badge badge-blue">{d.pagos} pagos</span></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'ofrendas' && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div className="card">
            <h3 style={{ fontFamily:'var(--font-heading)', fontSize:16, fontWeight:600, marginBottom:16 }}>Registrar ofrendas del día</h3>
            <form onSubmit={agregarOfrenda} style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'flex-end' }}>
              <div className="form-group" style={{ flex:1, minWidth:120 }}>
                <label className="form-label">Monto (DOP)</label>
                <input type="number" value={formOfrenda.monto} onChange={e=>setFormOfrenda({...formOfrenda,monto:e.target.value})} className="form-input" min="1" step="0.01" required />
              </div>
              <div className="form-group" style={{ flex:1, minWidth:140 }}>
                <label className="form-label">Fecha</label>
                <input type="date" value={formOfrenda.fecha} onChange={e=>setFormOfrenda({...formOfrenda,fecha:e.target.value})} className="form-input" required />
              </div>
              <div className="form-group" style={{ flex:2, minWidth:180 }}>
                <label className="form-label">Descripción</label>
                <input value={formOfrenda.descripcion} onChange={e=>setFormOfrenda({...formOfrenda,descripcion:e.target.value})} className="form-input" placeholder="Ej: Ofrenda culto domingo" />
              </div>
              <button type="submit" className="btn btn-gold" style={{ marginBottom:4 }}>+ Agregar</button>
            </form>

            {ofrendasDia.length > 0 && (
              <div style={{ marginTop:16 }}>
                <table>
                  <thead><tr><th>Monto</th><th>Fecha</th><th>Descripción</th><th></th></tr></thead>
                  <tbody>
                    {ofrendasDia.map((o,i) => (
                      <tr key={i}>
                        <td style={{ color:'var(--gold)', fontWeight:600 }}>{fmt(o.monto)}</td>
                        <td style={{ color:'var(--text-muted)' }}>{o.fecha}</td>
                        <td>{o.descripcion || '—'}</td>
                        <td><button onClick={()=>setOfrendasDia(ofrendasDia.filter((_,j)=>j!==i))} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--red)' }}>✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop:16, background:'var(--bg-card)', border:'1px solid var(--green)', borderRadius:8, padding:'12px 16px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontWeight:600 }}>Total ofrendas del día:</span>
                    <span style={{ color:'var(--gold)', fontWeight:700, fontSize:18 }}>{fmt(totalOfrendasDia)}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                    <span style={{ fontWeight:600 }}>Diezmo de ofrenda (10%):</span>
                    <span style={{ color:'var(--green)', fontWeight:700, fontSize:18 }}>{fmt(diezmoDeOfrenda)}</span>
                  </div>
                  {error && <div className="alert alert-error" style={{ marginBottom:10 }}>{error}</div>}
                  <button onClick={guardarOfrendas} className="btn btn-gold" disabled={saving} style={{ width:'100%' }}>
                    {saving ? 'Guardando...' : '💾 Guardar ofrendas en Ingresos'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <h3 style={{ fontFamily:'var(--font-heading)', fontSize:16, fontWeight:600, marginBottom:12 }}>Ofrendas registradas — {anio}</h3>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Fecha</th><th>Monto</th><th>Descripción</th><th>Acciones</th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={4} style={{ textAlign:'center', padding:40 }}><span className="spinner" /></td></tr>
                  : ingresos.filter(i => catIng.find(c=>c.id===i.categoria_id)?.nombre === 'Ofrenda').length === 0
                    ? <tr><td colSpan={4} style={{ textAlign:'center', padding:30, color:'var(--text-muted)' }}>Sin registros</td></tr>
                    : ingresos.filter(i => catIng.find(c=>c.id===i.categoria_id)?.nombre === 'Ofrenda').map(i => (
                      <tr key={i.id}>
                        <td style={{ color:'var(--text-muted)' }}>{new Date(i.fecha).toLocaleDateString('es-DO')}</td>
                        <td style={{ fontWeight:600, color:'var(--gold)' }}>{fmt(i.monto)}</td>
                        <td>{i.descripcion || '—'}</td>
                        <td>
                          <button onClick={() => eliminarIngreso(i.id)}
                            style={{ background:'none', border:'none', cursor:'pointer', color:'var(--red)', fontSize:13 }}>
                            🗑 Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {modal === 'ingreso' && (
        <Modal title="Registrar Ingreso" onClose={() => setModal(null)}>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={submitIngreso} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div className="form-group">
              <label className="form-label">Categoría *</label>
              <select value={formIng.categoria_id} onChange={e=>setFormIng({...formIng,categoria_id:e.target.value})} className="form-input" required>
                <option value="">— Seleccionar —</option>
                {catIng.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Monto (DOP) *</label>
                <input type="number" value={formIng.monto} onChange={e=>setFormIng({...formIng,monto:e.target.value})} className="form-input" min="0.01" step="0.01" required />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha *</label>
                <input type="date" value={formIng.fecha} onChange={e=>setFormIng({...formIng,fecha:e.target.value})} className="form-input" required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Descripción</label>
              <input value={formIng.descripcion} onChange={e=>setFormIng({...formIng,descripcion:e.target.value})} className="form-input" />
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={()=>setModal(null)}>Cancelar</button>
              <button type="submit" className="btn btn-gold" disabled={saving}>{saving?'Guardando...':'Registrar ingreso'}</button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'gasto' && (
        <Modal title="Registrar Gasto" onClose={() => setModal(null)}>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={submitGasto} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div className="form-group">
              <label className="form-label">Categoría *</label>
              <select value={formGas.categoria_id} onChange={e=>setFormGas({...formGas,categoria_id:e.target.value})} className="form-input" required>
                <option value="">— Seleccionar —</option>
                {catGas.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Monto (DOP) *</label>
                <input type="number" value={formGas.monto} onChange={e=>setFormGas({...formGas,monto:e.target.value})} className="form-input" min="0.01" step="0.01" required />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha *</label>
                <input type="date" value={formGas.fecha} onChange={e=>setFormGas({...formGas,fecha:e.target.value})} className="form-input" required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Descripción *</label>
              <input value={formGas.descripcion} onChange={e=>setFormGas({...formGas,descripcion:e.target.value})} className="form-input" required />
            </div>
            <div className="form-group">
              <label className="form-label">Beneficiario</label>
              <input value={formGas.beneficiario} onChange={e=>setFormGas({...formGas,beneficiario:e.target.value})} className="form-input" />
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={()=>setModal(null)}>Cancelar</button>
              <button type="submit" className="btn btn-gold" disabled={saving}>{saving?'Guardando...':'Registrar gasto'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
