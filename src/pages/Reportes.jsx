import { useState, useEffect } from 'react'
import { getIngresos, getGastos, getCategoriasIngreso, getCategoriasGasto } from '../api/client'

const fmt = (n) => new Intl.NumberFormat('es-DO', { style:'currency', currency:'DOP', maximumFractionDigits:0 }).format(n)
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function Reportes() {
  const [ingresos, setIngresos] = useState([])
  const [gastos, setGastos] = useState([])
  const [catIng, setCatIng] = useState([])
  const [catGas, setCatGas] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('mensual')
  const anioActual = new Date().getFullYear()
  const mesActual = new Date().getMonth()
  const [anio, setAnio] = useState(anioActual)
  const [mes, setMes] = useState(mesActual)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [i, g, ci, cg] = await Promise.allSettled([
          getIngresos({ limit:1000 }),
          getGastos({ limit:1000 }),
          getCategoriasIngreso(),
          getCategoriasGasto(),
        ])
        if (i.status === 'fulfilled') setIngresos(i.value.data)
        if (g.status === 'fulfilled') setGastos(g.value.data)
        if (ci.status === 'fulfilled') setCatIng(ci.value.data)
        if (cg.status === 'fulfilled') setCatGas(cg.value.data)
      } catch(_) {}
      setLoading(false)
    }
    load()
  }, [])

  const getNombreCatIng = (id) => catIng.find(c => c.id === id)?.nombre || 'Otro'
  const getNombreCatGas = (id) => catGas.find(c => c.id === id)?.nombre || 'Otro'

  const ingresosMes = ingresos.filter(i => {
    const f = new Date(i.fecha)
    return f.getFullYear() === anio && f.getMonth() === mes
  })
  const gastosMes = gastos.filter(g => {
    const f = new Date(g.fecha)
    return f.getFullYear() === anio && f.getMonth() === mes
  })

  const ingresosAnio = ingresos.filter(i => new Date(i.fecha).getFullYear() === anio)
  const gastosAnio = gastos.filter(g => new Date(g.fecha).getFullYear() === anio)

  const totalIngMes = ingresosMes.reduce((a,b) => a + parseFloat(b.monto), 0)
  const totalGasMes = gastosMes.reduce((a,b) => a + parseFloat(b.monto), 0)
  const totalIngAnio = ingresosAnio.reduce((a,b) => a + parseFloat(b.monto), 0)
  const totalGasAnio = gastosAnio.reduce((a,b) => a + parseFloat(b.monto), 0)

  const agruparPorCategoria = (lista, getNombre) => {
    const mapa = {}
    lista.forEach(item => {
      const cat = getNombre(item.categoria_id)
      if (!mapa[cat]) mapa[cat] = 0
      mapa[cat] += parseFloat(item.monto)
    })
    return Object.entries(mapa).sort((a,b) => b[1] - a[1])
  }

  const resumenMensualAnio = MESES.map((nombre, i) => {
    const ing = ingresos.filter(x => {
      const f = new Date(x.fecha)
      return f.getFullYear() === anio && f.getMonth() === i
    }).reduce((a,b) => a + parseFloat(b.monto), 0)
    const gas = gastos.filter(x => {
      const f = new Date(x.fecha)
      return f.getFullYear() === anio && f.getMonth() === i
    }).reduce((a,b) => a + parseFloat(b.monto), 0)
    return { nombre, ing, gas, balance: ing - gas }
  })

  const imprimir = () => window.print()

  const aniosDisponibles = [...new Set([
    ...ingresos.map(i => new Date(i.fecha).getFullYear()),
    ...gastos.map(g => new Date(g.fecha).getFullYear()),
    anioActual
  ])].sort((a,b) => b - a)

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reportes de Tesoreria</h1>
          <p className="page-subtitle">Reportes mensuales y anuales</p>
        </div>
        <button className="btn btn-ghost" onClick={imprimir}>Imprimir reporte</button>
      </div>

      <div style={{ display:'flex', gap:4, marginBottom:20, borderBottom:'1px solid var(--border)' }}>
        {[['mensual','Reporte Mensual'],['anual','Reporte Anual']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ background:'none', border:'none', cursor:'pointer', padding:'8px 18px',
              color: tab===id ? 'var(--gold)' : 'var(--text-muted)',
              borderBottom: tab===id ? '2px solid var(--gold)' : '2px solid transparent',
              fontSize:14, fontWeight:500, fontFamily:'var(--font-body)'
            }}
          >{label}</button>
        ))}
      </div>

      {tab === 'mensual' && (
        <div>
          <div className="card" style={{ marginBottom:16 }}>
            <div className="grid-2" style={{ gap:12 }}>
              <div className="form-group">
                <label className="form-label">Mes</label>
                <select value={mes} onChange={e=>setMes(parseInt(e.target.value))} className="form-input">
                  {MESES.map((m,i) => <option key={i} value={i}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Año</label>
                <select value={anio} onChange={e=>setAnio(parseInt(e.target.value))} className="form-input">
                  {aniosDisponibles.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div style={{ fontFamily:'var(--font-heading)', fontSize:18, fontWeight:700, marginBottom:16, color:'var(--gold)' }}>
            Reporte {MESES[mes]} {anio}
          </div>

          <div className="grid-3" style={{ marginBottom:20 }}>
            <div className="stat-card">
              <div className="stat-value text-green" style={{ fontSize:22 }}>{fmt(totalIngMes)}</div>
              <div className="stat-label">Total ingresos</div>
            </div>
            <div className="stat-card">
              <div className="stat-value text-red" style={{ fontSize:22 }}>{fmt(totalGasMes)}</div>
              <div className="stat-label">Total gastos</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ fontSize:22, color: (totalIngMes-totalGasMes) >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt(totalIngMes - totalGasMes)}</div>
              <div className="stat-label">Balance del mes</div>
            </div>
          </div>

          <div className="grid-2" style={{ gap:16, marginBottom:16 }}>
            <div className="card">
              <h3 style={{ fontFamily:'var(--font-heading)', fontSize:15, fontWeight:600, marginBottom:14, color:'var(--green)' }}>Ingresos por categoria</h3>
              {agruparPorCategoria(ingresosMes, getNombreCatIng).length === 0
                ? <p style={{ color:'var(--text-muted)', fontSize:13 }}>Sin ingresos este mes</p>
                : agruparPorCategoria(ingresosMes, getNombreCatIng).map(([cat, total]) => (
                  <div key={cat} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                    <span>{cat}</span>
                    <span style={{ fontWeight:600, color:'var(--green)' }}>{fmt(total)}</span>
                  </div>
                ))
              }
            </div>
            <div className="card">
              <h3 style={{ fontFamily:'var(--font-heading)', fontSize:15, fontWeight:600, marginBottom:14, color:'var(--red)' }}>Gastos por categoria</h3>
              {agruparPorCategoria(gastosMes, getNombreCatGas).length === 0
                ? <p style={{ color:'var(--text-muted)', fontSize:13 }}>Sin gastos este mes</p>
                : agruparPorCategoria(gastosMes, getNombreCatGas).map(([cat, total]) => (
                  <div key={cat} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                    <span>{cat}</span>
                    <span style={{ fontWeight:600, color:'var(--red)' }}>{fmt(total)}</span>
                  </div>
                ))
              }
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontFamily:'var(--font-heading)', fontSize:15, fontWeight:600, marginBottom:14 }}>Detalle de ingresos</h3>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Fecha</th><th>Categoria</th><th>Descripcion</th><th>Monto</th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={4} style={{ textAlign:'center', padding:20 }}><span className="spinner" /></td></tr>
                  : ingresosMes.length === 0
                    ? <tr><td colSpan={4} style={{ textAlign:'center', padding:20, color:'var(--text-muted)' }}>Sin registros</td></tr>
                    : ingresosMes.map(i => (
                      <tr key={i.id}>
                        <td style={{ color:'var(--text-muted)' }}>{new Date(i.fecha).toLocaleDateString('es-DO')}</td>
                        <td>{getNombreCatIng(i.categoria_id)}</td>
                        <td style={{ color:'var(--text-muted)' }}>{i.descripcion || '—'}</td>
                        <td style={{ fontWeight:600, color:'var(--green)' }}>{fmt(i.monto)}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>

          <div className="card" style={{ marginTop:16 }}>
            <h3 style={{ fontFamily:'var(--font-heading)', fontSize:15, fontWeight:600, marginBottom:14 }}>Detalle de gastos</h3>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Fecha</th><th>Categoria</th><th>Descripcion</th><th>Beneficiario</th><th>Monto</th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={5} style={{ textAlign:'center', padding:20 }}><span className="spinner" /></td></tr>
                  : gastosMes.length === 0
                    ? <tr><td colSpan={5} style={{ textAlign:'center', padding:20, color:'var(--text-muted)' }}>Sin registros</td></tr>
                    : gastosMes.map(g => (
                      <tr key={g.id}>
                        <td style={{ color:'var(--text-muted)' }}>{new Date(g.fecha).toLocaleDateString('es-DO')}</td>
                        <td>{getNombreCatGas(g.categoria_id)}</td>
                        <td style={{ color:'var(--text-muted)' }}>{g.descripcion || '—'}</td>
                        <td style={{ color:'var(--text-muted)' }}>{g.beneficiario || '—'}</td>
                        <td style={{ fontWeight:600, color:'var(--red)' }}>{fmt(g.monto)}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'anual' && (
        <div>
          <div className="card" style={{ marginBottom:16, maxWidth:200 }}>
            <div className="form-group">
              <label className="form-label">Año</label>
              <select value={anio} onChange={e=>setAnio(parseInt(e.target.value))} className="form-input">
                {aniosDisponibles.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <div style={{ fontFamily:'var(--font-heading)', fontSize:18, fontWeight:700, marginBottom:16, color:'var(--gold)' }}>
            Reporte Anual {anio}
          </div>

          <div className="grid-3" style={{ marginBottom:20 }}>
            <div className="stat-card">
              <div className="stat-value text-green" style={{ fontSize:22 }}>{fmt(totalIngAnio)}</div>
              <div className="stat-label">Total ingresos {anio}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value text-red" style={{ fontSize:22 }}>{fmt(totalGasAnio)}</div>
              <div className="stat-label">Total gastos {anio}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ fontSize:22, color: (totalIngAnio-totalGasAnio) >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt(totalIngAnio - totalGasAnio)}</div>
              <div className="stat-label">Balance {anio}</div>
            </div>
          </div>

          <div className="card" style={{ marginBottom:16 }}>
            <h3 style={{ fontFamily:'var(--font-heading)', fontSize:15, fontWeight:600, marginBottom:14 }}>Resumen mensual</h3>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Mes</th><th>Ingresos</th><th>Gastos</th><th>Balance</th></tr></thead>
                <tbody>
                  {resumenMensualAnio.filter(r => r.ing > 0 || r.gas > 0).length === 0
                    ? <tr><td colSpan={4} style={{ textAlign:'center', padding:20, color:'var(--text-muted)' }}>Sin registros para este año</td></tr>
                    : resumenMensualAnio.map(r => (
                      <tr key={r.nombre}>
                        <td style={{ fontWeight:500 }}>{r.nombre}</td>
                        <td style={{ color:'var(--green)', fontWeight:600 }}>{fmt(r.ing)}</td>
                        <td style={{ color:'var(--red)', fontWeight:600 }}>{fmt(r.gas)}</td>
                        <td style={{ fontWeight:700, color: r.balance >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt(r.balance)}</td>
                      </tr>
                    ))
                  }
                  <tr style={{ borderTop:'2px solid var(--gold)' }}>
                    <td style={{ fontWeight:700 }}>TOTAL</td>
                    <td style={{ color:'var(--green)', fontWeight:700 }}>{fmt(totalIngAnio)}</td>
                    <td style={{ color:'var(--red)', fontWeight:700 }}>{fmt(totalGasAnio)}</td>
                    <td style={{ fontWeight:700, color: (totalIngAnio-totalGasAnio) >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt(totalIngAnio - totalGasAnio)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid-2" style={{ gap:16 }}>
            <div className="card">
              <h3 style={{ fontFamily:'var(--font-heading)', fontSize:15, fontWeight:600, marginBottom:14, color:'var(--green)' }}>Ingresos por categoria</h3>
              {agruparPorCategoria(ingresosAnio, getNombreCatIng).length === 0
                ? <p style={{ color:'var(--text-muted)', fontSize:13 }}>Sin ingresos este año</p>
                : agruparPorCategoria(ingresosAnio, getNombreCatIng).map(([cat, total]) => (
                  <div key={cat} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                    <span>{cat}</span>
                    <span style={{ fontWeight:600, color:'var(--green)' }}>{fmt(total)}</span>
                  </div>
                ))
              }
            </div>
            <div className="card">
              <h3 style={{ fontFamily:'var(--font-heading)', fontSize:15, fontWeight:600, marginBottom:14, color:'var(--red)' }}>Gastos por categoria</h3>
              {agruparPorCategoria(gastosAnio, getNombreCatGas).length === 0
                ? <p style={{ color:'var(--text-muted)', fontSize:13 }}>Sin gastos este año</p>
                : agruparPorCategoria(gastosAnio, getNombreCatGas).map(([cat, total]) => (
                  <div key={cat} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                    <span>{cat}</span>
                    <span style={{ fontWeight:600, color:'var(--red)' }}>{fmt(total)}</span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          .sidebar, .page-header button, .btn { display: none !important; }
          .card { box-shadow: none !important; border: 1px solid #ccc !important; }
          body { background: white !important; color: black !important; }
        }
      `}</style>
    </div>
  )
}
