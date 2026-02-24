import { useEffect, useState, useRef } from 'react'

const MESES_CORTOS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const MESES_LARGOS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function MonthPicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const [year, setYear] = useState(() => value ? parseInt(value.split('-')[0]) : new Date().getFullYear())
  const month = value ? parseInt(value.split('-')[1]) - 1 : new Date().getMonth()

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const select = (m) => {
    const val = year + '-' + String(m+1).padStart(2,'0')
    onChange({ target: { value: val } })
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button type='button' onClick={() => setOpen(o=>!o)} className='form-input'
        style={{ cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, minWidth:180 }}>
        <span>{MESES_LARGOS[month]} {year}</span>
        <span style={{ fontSize:13, opacity:0.5 }}>&#128197;</span>
      </button>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, zIndex:1000, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', boxShadow:'var(--shadow-lg)', padding:16, minWidth:220 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <button type='button' onClick={() => setYear(y=>y-1)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:20, padding:'2px 10px' }}>&#8249;</button>
            <div style={{ fontFamily:'var(--font-heading)', fontWeight:600, color:'var(--gold)', fontSize:15 }}>{year}</div>
            <button type='button' onClick={() => setYear(y=>y+1)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:20, padding:'2px 10px' }}>&#8250;</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:4 }}>
            {MESES_CORTOS.map((m,i) => (
              <button key={i} type='button' onClick={() => select(i)} style={{
                padding:'8px 4px', border:'none', borderRadius:8, cursor:'pointer', fontSize:13,
                background: i===month && year===parseInt(value?.split('-')[0]) ? 'var(--gold)' : 'transparent',
                color: i===month && year===parseInt(value?.split('-')[0]) ? '#000' : 'var(--text)',
                fontWeight: i===month ? 600 : 400
              }}>{m}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
import DatePicker from '../components/DatePicker'
import { getIngresos, createIngreso, deleteIngreso, getGastos, createGasto, deleteGasto, getCategoriasIngreso, getCategoriasGasto, getResumenDiezmos, getMiembros } from '../api/client'

const fmt = (n) => new Intl.NumberFormat('es-DO', { style:'currency', currency:'DOP', maximumFractionDigits:0 }).format(n)

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>x</button>
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
  const [mesCentral, setMesCentral] = useState(new Date().toISOString().slice(0,7))
  const anio = new Date().getFullYear()
  const hoy = new Date().toISOString().split('T')[0]

  const [formIng, setFormIng] = useState({ categoria_id:'', monto:'', fecha: hoy, descripcion:'' })
  const [formGas, setFormGas] = useState({ categoria_id:'', monto:'', fecha: hoy, descripcion:'', beneficiario:'' })
  const [diezmosDia, setDiezmosDia] = useState([])
  const [formDiezmo, setFormDiezmo] = useState({ miembro_id:'', monto:'', fecha: hoy })
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
        getIngresos({ limit:500 }), getGastos({ limit:500 }),
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

  const agregarDiezmo = (e) => {
    e.preventDefault()
    if (!formDiezmo.miembro_id || !formDiezmo.monto) return
    const miembro = miembros.find(m => m.id === formDiezmo.miembro_id)
    setDiezmosDia([...diezmosDia, { ...formDiezmo, nombre: `${miembro?.nombres} ${miembro?.apellidos}` }])
    setFormDiezmo({ miembro_id:'', monto:'', fecha: hoy })
  }

  const guardarDiezmos = async () => {
    if (diezmosDia.length === 0) return
    setSaving(true); setError('')
    const catId = getCatId('Diezmo')
    if (!catId) { setError('No existe categoria Diezmo'); setSaving(false); return }
    const catGasId = catGas[0]?.id
    if (!catGasId) { setError('No hay categorias de gasto'); setSaving(false); return }
    try {
      for (const d of diezmosDia) {
        await createIngreso({ categoria_id: catId, monto: parseFloat(d.monto), fecha: d.fecha, descripcion: 'Diezmo', miembro_id: d.miembro_id })
      }
      await createGasto({ categoria_id: catGasId, monto: parseFloat(diezmoDeDiezmo.toFixed(2)), fecha: diezmosDia[0].fecha, descripcion: 'Envio a la Central - Diezmos', beneficiario: 'Iglesia Central' })
      await loadData()
      setDiezmosDia([])
      alert(`Diezmos guardados. Total: ${fmt(totalDiezmosDia)} | Envio a la Central: ${fmt(diezmoDeDiezmo)}`)
    } catch(err) { setError(err.response?.data?.detail || 'Error al guardar') }
    setSaving(false)
  }

  const agregarOfrenda = (e) => {
    e.preventDefault()
    if (!formOfrenda.monto) return
    setOfrendasDia([...ofrendasDia, { ...formOfrenda }])
    setFormOfrenda({ monto:'', fecha: hoy, descripcion:'' })
  }

  const guardarOfrendas = async () => {
    if (ofrendasDia.length === 0) return
    setSaving(true); setError('')
    const catId = getCatId('Ofrenda')
    if (!catId) { setError('No existe categoria Ofrenda'); setSaving(false); return }
    const catGasId = catGas[0]?.id
    if (!catGasId) { setError('No hay categorias de gasto'); setSaving(false); return }
    try {
      for (const o of ofrendasDia) {
        await createIngreso({ categoria_id: catId, monto: parseFloat(o.monto), fecha: o.fecha, descripcion: o.descripcion || 'Ofrenda' })
      }
      await createGasto({ categoria_id: catGasId, monto: parseFloat(diezmoDeOfrenda.toFixed(2)), fecha: ofrendasDia[0].fecha, descripcion: 'Envio a la Central - Ofrendas', beneficiario: 'Iglesia Central' })
      await loadData()
      setOfrendasDia([])
      alert(`Ofrendas guardadas. Total: ${fmt(totalOfrendasDia)} | Envio a la Central: ${fmt(diezmoDeOfrenda)}`)
    } catch(err) { setError(err.response?.data?.detail || 'Error al guardar') }
    setSaving(false)
  }

  const submitIngreso = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await createIngreso({ ...formIng, categoria_id: parseInt(formIng.categoria_id), monto: parseFloat(formIng.monto) })
      await loadData(); setModal(null)
      setFormIng({ categoria_id:'', monto:'', fecha: hoy, descripcion:'' })
    } catch(err) { setError(err.response?.data?.detail || 'Error') }
    setSaving(false)
  }

  const submitGasto = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await createGasto({ ...formGas, categoria_id: parseInt(formGas.categoria_id), monto: parseFloat(formGas.monto) })
      await loadData(); setModal(null)
      setFormGas({ categoria_id:'', monto:'', fecha: hoy, descripcion:'', beneficiario:'' })
    } catch(err) { setError(err.response?.data?.detail || 'Error') }
    setSaving(false)
  }

  const eliminarIngreso = async (id) => {
    if (!confirm('Seguro que deseas eliminar este ingreso?')) return
    try { await deleteIngreso(id); await loadData() }
    catch(err) { alert(err.response?.data?.detail || 'Error al eliminar') }
  }

  const eliminarGasto = async (id) => {
    if (!confirm('Seguro que deseas eliminar este gasto?')) return
    try { await deleteGasto(id); await loadData() }
    catch(err) { alert(err.response?.data?.detail || 'Error al eliminar') }
  }

  // Calculos para la pestana central
  const enviosDiezmos = gastos.filter(g => g.descripcion === 'Envio a la Central - Diezmos' && g.fecha?.slice(0,7) === mesCentral)
  const enviosOfrendas = gastos.filter(g => g.descripcion === 'Envio a la Central - Ofrendas' && g.fecha?.slice(0,7) === mesCentral)
  const totalEnvioDiezmos = enviosDiezmos.reduce((a,b) => a + parseFloat(b.monto||0), 0)
  const totalEnvioOfrendas = enviosOfrendas.reduce((a,b) => a + parseFloat(b.monto||0), 0)

  const tabs = [
    { id:'ingresos', label:'Ingresos' },
    { id:'gastos', label:'Gastos' },
    { id:'diezmos', label:'Diezmos' },
    { id:'ofrendas', label:'Ofrendas' },
    { id:'central', label:'Envio a la Central' },
  ]

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tesoreria</h1>
          <p className="page-subtitle">Control financiero de la iglesia</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn btn-ghost" onClick={() => setModal('gasto')}>+ Registrar gasto</button>
          <button className="btn btn-gold" onClick={() => setModal('ingreso')}>+ Registrar ingreso</button>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom:24 }}>
        <div className="stat-card">
          <div className="stat-icon">+</div>
          <div className="stat-value text-green" style={{ fontSize:24 }}>{fmt(totalIng)}</div>
          <div className="stat-label">Total ingresos</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">-</div>
          <div className="stat-value text-red" style={{ fontSize:24 }}>{fmt(totalGas)}</div>
          <div className="stat-label">Total gastos</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">$</div>
          <div className="stat-value" style={{ fontSize:24, color: (totalIng-totalGas)>=0?'var(--green)':'var(--red)' }}>
            {fmt(totalIng - totalGas)}
          </div>
          <div className="stat-label">Balance</div>
        </div>
      </div>

      <div style={{ display:'flex', gap:4, marginBottom:20, borderBottom:'1px solid var(--border)', flexWrap:'wrap' }}>
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
              <thead><tr><th>Fecha</th><th>Categoria</th><th>Monto</th><th>Descripcion</th><th>Acciones</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={5} style={{ textAlign:'center', padding:40 }}><span className="spinner" /></td></tr>
                : ingresos.map(i => (
                  <tr key={i.id}>
                    <td style={{ color:'var(--text-muted)' }}>{new Date(i.fecha).toLocaleDateString('es-DO')}</td>
                    <td><span className="badge badge-green">{catIng.find(c=>c.id===i.categoria_id)?.nombre || i.categoria_id}</span></td>
                    <td style={{ fontWeight:600, color:'var(--green)' }}>{fmt(i.monto)}</td>
                    <td style={{ color:'var(--text-muted)' }}>{i.descripcion || '-'}</td>
                    <td>
                      <button onClick={() => eliminarIngreso(i.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--red)', fontSize:13, padding:'2px 8px' }}>
                        Eliminar
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
              <thead><tr><th>Fecha</th><th>Categoria</th><th>Monto</th><th>Descripcion</th><th>Beneficiario</th><th>Acciones</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={6} style={{ textAlign:'center', padding:40 }}><span className="spinner" /></td></tr>
                : gastos.map(g => (
                  <tr key={g.id}>
                    <td style={{ color:'var(--text-muted)' }}>{new Date(g.fecha).toLocaleDateString('es-DO')}</td>
                    <td><span className="badge badge-red">{catGas.find(c=>c.id===g.categoria_id)?.nombre || g.categoria_id}</span></td>
                    <td style={{ fontWeight:600, color:'var(--red)' }}>{fmt(g.monto)}</td>
                    <td>{g.descripcion}</td>
                    <td style={{ color:'var(--text-muted)' }}>{g.beneficiario || '-'}</td>
                    <td>
                      <button onClick={() => eliminarGasto(g.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--red)', fontSize:13, padding:'2px 8px' }}>
                        Eliminar
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
            <h3 style={{ fontFamily:'var(--font-heading)', fontSize:16, fontWeight:600, marginBottom:16 }}>Registrar diezmos del dia</h3>
            <form onSubmit={agregarDiezmo} style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'flex-end' }}>
              <div className="form-group" style={{ flex:2, minWidth:180 }}>
                <label className="form-label">Miembro</label>
                <select value={formDiezmo.miembro_id} onChange={e=>setFormDiezmo({...formDiezmo,miembro_id:e.target.value})} className="form-input" required>
                  <option value="">-- Seleccionar --</option>
                  {miembros.map(m=><option key={m.id} value={m.id}>{m.nombres} {m.apellidos}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ flex:1, minWidth:120 }}>
                <label className="form-label">Monto (DOP)</label>
                <input type="number" value={formDiezmo.monto} onChange={e=>setFormDiezmo({...formDiezmo,monto:e.target.value})} className="form-input" min="1" step="0.01" required />
              </div>
              <div className="form-group" style={{ flex:1, minWidth:140 }}>
                <label className="form-label">Fecha</label>
                <DatePicker name="fecha" value={formDiezmo.fecha} onChange={e=>setFormDiezmo({...formDiezmo,fecha:e.target.value})} />
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
                        <td><button onClick={()=>setDiezmosDia(diezmosDia.filter((_,j)=>j!==i))} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--red)' }}>x</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop:16, background:'var(--bg-card)', border:'1px solid var(--gold)', borderRadius:8, padding:'12px 16px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontWeight:600 }}>Total diezmos del dia:</span>
                    <span style={{ color:'var(--gold)', fontWeight:700, fontSize:18 }}>{fmt(totalDiezmosDia)}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                    <span style={{ fontWeight:600 }}>Envio a la Central (10%):</span>
                    <span style={{ color:'var(--green)', fontWeight:700, fontSize:18 }}>{fmt(diezmoDeDiezmo)}</span>
                  </div>
                  {error && <div className="alert alert-error" style={{ marginBottom:10 }}>{error}</div>}
                  <button onClick={guardarDiezmos} className="btn btn-gold" disabled={saving} style={{ width:'100%' }}>
                    {saving ? 'Guardando...' : 'Guardar diezmos y registrar envio a la Central'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <h3 style={{ fontFamily:'var(--font-heading)', fontSize:16, fontWeight:600, marginBottom:12 }}>Diezmos registrados - {anio}</h3>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Fecha</th><th>Miembro</th><th>Monto</th><th>Acciones</th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={4} style={{ textAlign:'center', padding:40 }}><span className="spinner" /></td></tr>
                  : ingresos.filter(i => catIng.find(c=>c.id===i.categoria_id)?.nombre === 'Diezmo').length === 0
                    ? <tr><td colSpan={4} style={{ textAlign:'center', padding:30, color:'var(--text-muted)' }}>Sin registros</td></tr>
                    : ingresos.filter(i => catIng.find(c=>c.id===i.categoria_id)?.nombre === 'Diezmo').map(i => (
                      <tr key={i.id}>
                        <td style={{ color:'var(--text-muted)' }}>{new Date(i.fecha).toLocaleDateString('es-DO')}</td>
                        <td style={{ fontWeight:500 }}>{miembros.find(m=>m.id===i.miembro_id) ? `${miembros.find(m=>m.id===i.miembro_id).nombres} ${miembros.find(m=>m.id===i.miembro_id).apellidos}` : '-'}</td>
                        <td style={{ fontWeight:600, color:'var(--gold)' }}>{fmt(i.monto)}</td>
                        <td>
                          <button onClick={() => eliminarIngreso(i.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--red)', fontSize:13 }}>
                            Eliminar
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

      {tab === 'ofrendas' && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div className="card">
            <h3 style={{ fontFamily:'var(--font-heading)', fontSize:16, fontWeight:600, marginBottom:16 }}>Registrar ofrendas del dia</h3>
            <form onSubmit={agregarOfrenda} style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'flex-end' }}>
              <div className="form-group" style={{ flex:1, minWidth:120 }}>
                <label className="form-label">Monto (DOP)</label>
                <input type="number" value={formOfrenda.monto} onChange={e=>setFormOfrenda({...formOfrenda,monto:e.target.value})} className="form-input" min="1" step="0.01" required />
              </div>
              <div className="form-group" style={{ flex:1, minWidth:140 }}>
                <label className="form-label">Fecha</label>
                <DatePicker name="fecha" value={formOfrenda.fecha} onChange={e=>setFormOfrenda({...formOfrenda,fecha:e.target.value})} />
              </div>
              <div className="form-group" style={{ flex:2, minWidth:180 }}>
                <label className="form-label">Descripcion</label>
                <input value={formOfrenda.descripcion} onChange={e=>setFormOfrenda({...formOfrenda,descripcion:e.target.value})} className="form-input" placeholder="Ej: Ofrenda culto domingo" />
              </div>
              <button type="submit" className="btn btn-gold" style={{ marginBottom:4 }}>+ Agregar</button>
            </form>

            {ofrendasDia.length > 0 && (
              <div style={{ marginTop:16 }}>
                <table>
                  <thead><tr><th>Monto</th><th>Fecha</th><th>Descripcion</th><th></th></tr></thead>
                  <tbody>
                    {ofrendasDia.map((o,i) => (
                      <tr key={i}>
                        <td style={{ color:'var(--gold)', fontWeight:600 }}>{fmt(o.monto)}</td>
                        <td style={{ color:'var(--text-muted)' }}>{o.fecha}</td>
                        <td>{o.descripcion || '-'}</td>
                        <td><button onClick={()=>setOfrendasDia(ofrendasDia.filter((_,j)=>j!==i))} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--red)' }}>x</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop:16, background:'var(--bg-card)', border:'1px solid var(--green)', borderRadius:8, padding:'12px 16px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontWeight:600 }}>Total ofrendas del dia:</span>
                    <span style={{ color:'var(--gold)', fontWeight:700, fontSize:18 }}>{fmt(totalOfrendasDia)}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                    <span style={{ fontWeight:600 }}>Envio a la Central (10%):</span>
                    <span style={{ color:'var(--green)', fontWeight:700, fontSize:18 }}>{fmt(diezmoDeOfrenda)}</span>
                  </div>
                  {error && <div className="alert alert-error" style={{ marginBottom:10 }}>{error}</div>}
                  <button onClick={guardarOfrendas} className="btn btn-gold" disabled={saving} style={{ width:'100%' }}>
                    {saving ? 'Guardando...' : 'Guardar ofrendas y registrar envio a la Central'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <h3 style={{ fontFamily:'var(--font-heading)', fontSize:16, fontWeight:600, marginBottom:12 }}>Ofrendas registradas - {anio}</h3>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Fecha</th><th>Monto</th><th>Descripcion</th><th>Acciones</th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={4} style={{ textAlign:'center', padding:40 }}><span className="spinner" /></td></tr>
                  : ingresos.filter(i => catIng.find(c=>c.id===i.categoria_id)?.nombre === 'Ofrenda').length === 0
                    ? <tr><td colSpan={4} style={{ textAlign:'center', padding:30, color:'var(--text-muted)' }}>Sin registros</td></tr>
                    : ingresos.filter(i => catIng.find(c=>c.id===i.categoria_id)?.nombre === 'Ofrenda').map(i => (
                      <tr key={i.id}>
                        <td style={{ color:'var(--text-muted)' }}>{new Date(i.fecha).toLocaleDateString('es-DO')}</td>
                        <td style={{ fontWeight:600, color:'var(--gold)' }}>{fmt(i.monto)}</td>
                        <td>{i.descripcion || '-'}</td>
                        <td>
                          <button onClick={() => eliminarIngreso(i.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--red)', fontSize:13 }}>
                            Eliminar
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

      {tab === 'central' && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <label className="form-label" style={{ margin:0 }}>Mes:</label>
            <MonthPicker value={mesCentral} onChange={e=>setMesCentral(e.target.value)} />
          </div>

          <div className="grid-2">
            <div className="stat-card" style={{ border:'1px solid var(--gold)', textAlign:'center' }}>
              <div style={{ fontSize:28, marginBottom:8 }}>🏦</div>
              <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:4 }}>Envío del diezmo de diezmo</div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:8 }}>{enviosDiezmos.length} registro(s)</div>
              {enviosDiezmos.map((e,i) => (
                <div key={i} style={{ fontSize:12, color:'var(--text-muted)', marginBottom:2 }}>
                  {new Date(e.fecha).toLocaleDateString('es-DO')} - {fmt(e.monto)}
                </div>
              ))}
              <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid var(--border)' }}>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>Total a llevar</div>
                <div style={{ fontSize:26, fontWeight:700, color:'var(--gold)', marginTop:4 }}>{fmt(totalEnvioDiezmos)}</div>
              </div>
            </div>

            <div className="stat-card" style={{ border:'1px solid var(--green)', textAlign:'center' }}>
              <div style={{ fontSize:28, marginBottom:8 }}>💝</div>
              <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:4 }}>Envío del diezmo de ofrenda</div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:8 }}>{enviosOfrendas.length} registro(s)</div>
              {enviosOfrendas.map((e,i) => (
                <div key={i} style={{ fontSize:12, color:'var(--text-muted)', marginBottom:2 }}>
                  {new Date(e.fecha).toLocaleDateString('es-DO')} - {fmt(e.monto)}
                </div>
              ))}
              <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid var(--border)' }}>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>Total a llevar</div>
                <div style={{ fontSize:26, fontWeight:700, color:'var(--green)', marginTop:4 }}>{fmt(totalEnvioOfrendas)}</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ border:'2px solid var(--gold)', textAlign:'center', padding:24 }}>
            <div style={{ fontSize:14, color:'var(--text-muted)', marginBottom:12 }}>Resumen del mes - Se llevan por separado a la Iglesia Central</div>
            <div style={{ display:'flex', justifyContent:'center', gap:60, flexWrap:'wrap' }}>
              <div>
                <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:4 }}>Envio de Diezmos</div>
                <div style={{ fontSize:28, fontWeight:700, color:'var(--gold)' }}>{fmt(totalEnvioDiezmos)}</div>
              </div>
              <div>
                <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:4 }}>Envio de Ofrendas</div>
                <div style={{ fontSize:28, fontWeight:700, color:'var(--green)' }}>{fmt(totalEnvioOfrendas)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {modal === 'ingreso' && (
        <Modal title="Registrar Ingreso" onClose={() => setModal(null)}>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={submitIngreso} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div className="form-group">
              <label className="form-label">Categoria *</label>
              <select value={formIng.categoria_id} onChange={e=>setFormIng({...formIng,categoria_id:e.target.value})} className="form-input" required>
                <option value="">-- Seleccionar --</option>
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
                <DatePicker name="fecha" value={formIng.fecha} onChange={e=>setFormIng({...formIng,fecha:e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Descripcion</label>
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
              <label className="form-label">Categoria *</label>
              <select value={formGas.categoria_id} onChange={e=>setFormGas({...formGas,categoria_id:e.target.value})} className="form-input" required>
                <option value="">-- Seleccionar --</option>
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
                <DatePicker name="fecha" value={formGas.fecha} onChange={e=>setFormGas({...formGas,fecha:e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Descripcion *</label>
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






