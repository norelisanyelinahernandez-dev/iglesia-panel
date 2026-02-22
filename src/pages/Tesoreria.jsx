import { useEffect, useState } from 'react'
import { getIngresos, createIngreso, getGastos, createGasto, getCategoriasIngreso, getCategoriasGasto, getResumenDiezmos } from '../api/client'

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
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [formIng, setFormIng] = useState({ categoria_id:'', monto:'', fecha: new Date().toISOString().split('T')[0], descripcion:'' })
  const [formGas, setFormGas] = useState({ categoria_id:'', monto:'', fecha: new Date().toISOString().split('T')[0], descripcion:'', beneficiario:'' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const anio = new Date().getFullYear()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [i, g, ci, cg, d] = await Promise.allSettled([
          getIngresos({ limit:200 }), getGastos({ limit:200 }),
          getCategoriasIngreso(), getCategoriasGasto(),
          getResumenDiezmos(anio)
        ])
        if (i.status==='fulfilled') setIngresos(i.value.data)
        if (g.status==='fulfilled') setGastos(g.value.data)
        if (ci.status==='fulfilled') setCatIng(ci.value.data)
        if (cg.status==='fulfilled') setCatGas(cg.value.data)
        if (d.status==='fulfilled') setDiezmos(d.value.data)
      } catch(_) {}
      setLoading(false)
    }
    load()
  }, [])

  const totalIng = ingresos.reduce((a,b) => a + parseFloat(b.monto), 0)
  const totalGas = gastos.reduce((a,b) => a + parseFloat(b.monto), 0)

  const submitIngreso = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await createIngreso({ ...formIng, categoria_id: parseInt(formIng.categoria_id), monto: parseFloat(formIng.monto) })
      const { data } = await getIngresos({ limit:200 })
      setIngresos(data); setModal(null)
      setFormIng({ categoria_id:'', monto:'', fecha: new Date().toISOString().split('T')[0], descripcion:'' })
    } catch(err) { setError(err.response?.data?.detail || 'Error') }
    setSaving(false)
  }

  const submitGasto = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await createGasto({ ...formGas, categoria_id: parseInt(formGas.categoria_id), monto: parseFloat(formGas.monto) })
      const { data } = await getGastos({ limit:200 })
      setGastos(data); setModal(null)
      setFormGas({ categoria_id:'', monto:'', fecha: new Date().toISOString().split('T')[0], descripcion:'', beneficiario:'' })
    } catch(err) { setError(err.response?.data?.detail || 'Error') }
    setSaving(false)
  }

  const tabs = [
    { id:'ingresos', label:'Ingresos' },
    { id:'gastos',   label:'Gastos' },
    { id:'diezmos',  label:'Diezmos' },
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

      {/* Summary */}
      <div className="grid-3" style={{ marginBottom:24 }}>
        <div className="stat-card">
          <div className="stat-icon">⬆</div>
          <div className="stat-value text-green" style={{ fontSize:24 }}>{fmt(totalIng)}</div>
          <div className="stat-label">Total ingresos</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⬇</div>
          <div className="stat-value text-red" style={{ fontSize:24 }}>{fmt(totalGas)}</div>
          <div className="stat-label">Total gastos</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">◉</div>
          <div className="stat-value" style={{ fontSize:24, color: (totalIng-totalGas)>=0?'var(--green)':'var(--red)' }}>
            {fmt(totalIng - totalGas)}
          </div>
          <div className="stat-label">Balance</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:20, borderBottom:'1px solid var(--border)', paddingBottom:0 }}>
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

      {/* Ingresos tab */}
      {tab === 'ingresos' && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Fecha</th><th>Categoría</th><th>Monto</th><th>Descripción</th><th>Comprobante</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={5} style={{ textAlign:'center', padding:40 }}><span className="spinner" /></td></tr>
                : ingresos.map(i => (
                  <tr key={i.id}>
                    <td style={{ color:'var(--text-muted)' }}>{new Date(i.fecha).toLocaleDateString('es-DO')}</td>
                    <td><span className="badge badge-green">{catIng.find(c=>c.id===i.categoria_id)?.nombre || i.categoria_id}</span></td>
                    <td style={{ fontWeight:600, color:'var(--green)' }}>{fmt(i.monto)}</td>
                    <td style={{ color:'var(--text-muted)' }}>{i.descripcion || '—'}</td>
                    <td style={{ color:'var(--text-muted)' }}>{i.comprobante || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Gastos tab */}
      {tab === 'gastos' && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Fecha</th><th>Categoría</th><th>Monto</th><th>Descripción</th><th>Beneficiario</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={5} style={{ textAlign:'center', padding:40 }}><span className="spinner" /></td></tr>
                : gastos.map(g => (
                  <tr key={g.id}>
                    <td style={{ color:'var(--text-muted)' }}>{new Date(g.fecha).toLocaleDateString('es-DO')}</td>
                    <td><span className="badge badge-red">{catGas.find(c=>c.id===g.categoria_id)?.nombre || g.categoria_id}</span></td>
                    <td style={{ fontWeight:600, color:'var(--red)' }}>{fmt(g.monto)}</td>
                    <td>{g.descripcion}</td>
                    <td style={{ color:'var(--text-muted)' }}>{g.beneficiario || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Diezmos tab */}
      {tab === 'diezmos' && (
        <div className="card">
          <div style={{ marginBottom:16 }}>
            <h3 style={{ fontFamily:'var(--font-heading)', fontSize:16, fontWeight:600 }}>Diezmos por miembro — {anio}</h3>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>#</th><th>Miembro</th><th>Total diezmado</th><th>Cantidad de pagos</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={4} style={{ textAlign:'center', padding:40 }}><span className="spinner" /></td></tr>
                : diezmos.length === 0
                  ? <tr><td colSpan={4} style={{ textAlign:'center', padding:30, color:'var(--text-muted)' }}>Sin registros de diezmos</td></tr>
                  : diezmos.map((d, i) => (
                    <tr key={i}>
                      <td style={{ color:'var(--text-muted)' }}>{i+1}</td>
                      <td style={{ fontWeight:500 }}>{d.miembro}</td>
                      <td style={{ fontWeight:600, color:'var(--gold)' }}>{fmt(d.total)}</td>
                      <td><span className="badge badge-blue">{d.pagos} pagos</span></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Ingreso Modal */}
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

      {/* New Gasto Modal */}
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
