import { useState, useEffect } from 'react'
import { getGastos, getCategoriasGasto } from '../api/client'
import DatePicker from '../components/DatePicker'


// ── Impresión con encabezado institucional ────────────────────────────────
const imprimirConEncabezado = (titulo, htmlContenido) => {
  const fecha = new Date().toLocaleDateString('es-DO', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
  const win = window.open('', '_blank', 'width=900,height=700')
  win.document.write(`<!DOCTYPE html><html lang="es"><head>
    <meta charset="UTF-8"/>
    <title>${titulo}</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family: Calibri, Arial, sans-serif; color: #1a1a2e; padding: 24px 32px; }
      .header { display:flex; align-items:center; gap:20px; border-bottom: 3px solid #1a2e4a; padding-bottom:14px; margin-bottom:18px; }
      .header img { width:72px; height:72px; object-fit:contain; border-radius:8px; }
      .header-info h1 { font-size:17px; font-weight:700; color:#1a2e4a; margin-bottom:3px; }
      .header-info p { font-size:13px; color:#4a6fa5; font-style:italic; margin-bottom:2px; }
      .header-info small { font-size:11px; color:#888; }
      h2 { font-size:15px; font-weight:700; color:#1a2e4a; margin:18px 0 10px; }
      table { width:100%; border-collapse:collapse; font-size:12px; margin-bottom:16px; }
      th { background:#1a2e4a; color:#fff; padding:7px 10px; text-align:left; font-weight:600; }
      td { padding:6px 10px; border-bottom:1px solid #e0e0e0; }
      tr:nth-child(even) td { background:#eef3fa; }
      .badge { display:inline-block; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:600; }
      .badge-green { background:#d4edda; color:#155724; }
      .badge-amber { background:#fff3cd; color:#856404; }
      .badge-red   { background:#f8d7da; color:#721c24; }
      .section { margin-bottom:20px; }
      .stat-row { display:flex; gap:24px; margin-bottom:14px; flex-wrap:wrap; }
      .stat-box { background:#eef3fa; border-radius:8px; padding:12px 20px; text-align:center; }
      .stat-box .val { font-size:22px; font-weight:700; color:#1a2e4a; }
      .stat-box .lbl { font-size:11px; color:#666; }
      .bar-wrap { background:#e0e0e0; border-radius:4px; height:8px; margin-top:4px; }
      .bar { height:8px; border-radius:4px; }
      .footer { margin-top:24px; padding-top:10px; border-top:1px solid #ddd; font-size:11px; color:#aaa; text-align:right; }
      @media print { body { padding:12px 20px; } }
    </style>
  </head><body>
    <div class="header">
      <img src="/logo_iglesia.jpg" onerror="this.style.display='none'" />
      <div class="header-info">
        <h1>Iglesia Pentecostal Juan 7:38: El Semillero 1/10</h1>
        <p>Pastora: Dinorah Bautista</p>
        <small>${titulo} &nbsp;·&nbsp; ${fecha}</small>
      </div>
    </div>
    ${htmlContenido}
    <div class="footer">Generado por el Sistema de Gestión — ${fecha}</div>
  </body></html>`)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print(); win.close() }, 400)
}

const fmt = (n) => new Intl.NumberFormat('es-DO', { style:'currency', currency:'DOP', maximumFractionDigits:0 }).format(n)
const STORAGE_PRESUPUESTO = 'presupuesto_anual'
const STORAGE_DEUDAS = 'deudas_iglesia'

export default function Finanzas() {
  const [tab, setTab] = useState('presupuesto')
  const [gastos, setGastos] = useState([])
  const [catGas, setCatGas] = useState([])
  const [loading, setLoading] = useState(true)
  const anio = new Date().getFullYear()

  const [presupuesto, setPresupuesto] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_PRESUPUESTO)) || {} }
    catch { return {} }
  })
  const [deudas, setDeudas] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_DEUDAS)) || [] }
    catch { return [] }
  })
  const [modalDeuda, setModalDeuda] = useState(false)
  const [editDeuda, setEditDeuda] = useState(null)
  const [formDeuda, setFormDeuda] = useState({ descripcion:'', monto_total:'', monto_pagado:'0', fecha_inicio:'', fecha_vencimiento:'', estado:'pendiente', notas:'' })
  const [guardado, setGuardado] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [g, cg] = await Promise.allSettled([
          getGastos({ limit:1000 }),
          getCategoriasGasto(),
        ])
        if (g.status === 'fulfilled') setGastos(g.value.data)
        if (cg.status === 'fulfilled') setCatGas(cg.value.data)
      } catch(_) {}
      setLoading(false)
    }
    load()
  }, [])

  const gastosAnio = gastos.filter(g => new Date(g.fecha).getFullYear() === anio)

  const gastoPorCategoria = catGas.map(cat => {
    const total = gastosAnio.filter(g => g.categoria_id === cat.id).reduce((a,b) => a + parseFloat(b.monto), 0)
    const pres = parseFloat(presupuesto[cat.id] || 0)
    const porcentaje = pres > 0 ? Math.min(Math.round((total/pres)*100), 100) : 0
    const excedido = pres > 0 && total > pres
    return { ...cat, total, pres, porcentaje, excedido }
  }).filter(c => c.total > 0 || c.pres > 0)

  const guardarPresupuesto = () => {
    localStorage.setItem(STORAGE_PRESUPUESTO, JSON.stringify(presupuesto))
    setGuardado(true)
    setTimeout(() => setGuardado(false), 3000)
  }

  const limpiarPresupuesto = () => {
    if (!window.confirm('¿Eliminar todos los presupuestos guardados? Esta acción no se puede deshacer.')) return
    localStorage.removeItem(STORAGE_PRESUPUESTO)
    setPresupuesto({})
    mostrarExito('Presupuesto eliminado')
  }

  const guardarDeuda = () => {
    if (!formDeuda.descripcion || !formDeuda.monto_total) return
    let nuevas
    if (editDeuda !== null) {
      nuevas = deudas.map((d,i) => i === editDeuda ? { ...formDeuda, id: d.id } : d)
      setEditDeuda(null)
    } else {
      nuevas = [...deudas, { ...formDeuda, id: Date.now() }]
    }
    setDeudas(nuevas)
    localStorage.setItem(STORAGE_DEUDAS, JSON.stringify(nuevas))
    setFormDeuda({ descripcion:'', monto_total:'', monto_pagado:'0', fecha_inicio:'', fecha_vencimiento:'', estado:'pendiente', notas:'' })
    setModalDeuda(false)
  }

  const eliminarDeuda = (id) => {
    if (!confirm('¿Eliminar este compromiso?')) return
    const nuevas = deudas.filter(d => d.id !== id)
    setDeudas(nuevas)
    localStorage.setItem(STORAGE_DEUDAS, JSON.stringify(nuevas))
  }

  const editarDeuda = (i) => {
    setFormDeuda(deudas[i])
    setEditDeuda(i)
    setModalDeuda(true)
  }

  const totalDeudas = deudas.filter(d => d.estado !== 'completado').reduce((a,b) => a + parseFloat(b.monto_total||0) - parseFloat(b.monto_pagado||0), 0)

  const ESTADO_BADGE = {
    pendiente: { label:'Pendiente', color:'var(--red)' },
    parcial: { label:'Pago parcial', color:'var(--gold)' },
    completado: { label:'Completado', color:'var(--green)' },
  }


  const imprimirPresupuesto = () => {
    const filas = gastoPorCategoria.map(cat => {
      const color = cat.excedido ? 'badge-red' : cat.porcentaje > 80 ? 'badge-amber' : 'badge-green'
      const estado = cat.excedido ? 'Excedido' : cat.porcentaje > 80 ? 'En límite' : 'Normal'
      return `<tr>
        <td>${cat.nombre}</td>
        <td style="text-align:right">${fmt(cat.pres)}</td>
        <td style="text-align:right">${fmt(cat.total)}</td>
        <td style="text-align:right">${fmt(Math.max(0, cat.pres - cat.total))}</td>
        <td style="text-align:center">${cat.pres > 0 ? cat.porcentaje + '%' : '—'}</td>
        <td><span class="badge ${color}">${estado}</span></td>
      </tr>`
    }).join('')
    const html = `
      <h2>Seguimiento de Presupuesto ${anio}</h2>
      <table>
        <thead><tr><th>Categoría</th><th>Presupuesto</th><th>Gastado</th><th>Disponible</th><th>%</th><th>Estado</th></tr></thead>
        <tbody>${filas.length ? filas : '<tr><td colspan="6" style="text-align:center;color:#888">Sin datos aún</td></tr>'}</tbody>
      </table>`
    imprimirConEncabezado('Presupuesto Anual', html)
  }

  const imprimirDeudas = () => {
    const filas = deudas.map(d => {
      const pendiente = parseFloat(d.monto_total||0) - parseFloat(d.monto_pagado||0)
      const color = d.estado === 'completado' ? 'badge-green' : d.estado === 'parcial' ? 'badge-amber' : 'badge-red'
      const label = { pendiente:'Pendiente', parcial:'Pago parcial', completado:'Completado' }[d.estado] || d.estado
      return `<tr>
        <td>${d.descripcion}</td>
        <td style="text-align:right">${fmt(d.monto_total)}</td>
        <td style="text-align:right">${fmt(d.monto_pagado)}</td>
        <td style="text-align:right">${fmt(pendiente)}</td>
        <td>${d.fecha_vencimiento ? new Date(d.fecha_vencimiento).toLocaleDateString('es-DO') : '—'}</td>
        <td><span class="badge ${color}">${label}</span></td>
      </tr>`
    }).join('')
    const html = `
      <div class="stat-row">
        <div class="stat-box"><div class="val">${fmt(totalDeudas)}</div><div class="lbl">Total pendiente</div></div>
        <div class="stat-box"><div class="val">${deudas.filter(d=>d.estado!=='completado').length}</div><div class="lbl">Compromisos activos</div></div>
      </div>
      <h2>Deudas y Compromisos Financieros</h2>
      <table>
        <thead><tr><th>Descripción</th><th>Total</th><th>Pagado</th><th>Pendiente</th><th>Vencimiento</th><th>Estado</th></tr></thead>
        <tbody>${filas.length ? filas : '<tr><td colspan="6" style="text-align:center;color:#888">Sin compromisos registrados</td></tr>'}</tbody>
      </table>`
    imprimirConEncabezado('Deudas y Compromisos', html)
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Finanzas</h1>
          <p className="page-subtitle">Presupuesto y compromisos financieros</p>
        </div>
      </div>

      <div style={{ display:'flex', gap:4, marginBottom:20, borderBottom:'1px solid var(--border)' }}>
        {[['presupuesto','Presupuesto Anual'],['deudas','Deudas y Compromisos']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ background:'none', border:'none', cursor:'pointer', padding:'8px 18px',
              color: tab===id ? 'var(--gold)' : 'var(--text-muted)',
              borderBottom: tab===id ? '2px solid var(--gold)' : '2px solid transparent',
              fontSize:14, fontWeight:500, fontFamily:'var(--font-body)'
            }}
          >{label}</button>
        ))}
      </div>

      {tab === 'presupuesto' && (
        <div>
          {guardado && <div className="alert alert-success" style={{ marginBottom:16 }}>Presupuesto guardado correctamente</div>}

          <div className="card" style={{ marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <h3 style={{ fontFamily:'var(--font-heading)', fontSize:15, fontWeight:600 }}>Definir presupuesto {anio} por categoría</h3>
              <button className="btn btn-ghost" style={{ fontSize:13 }} onClick={imprimirPresupuesto}>🖨️ Imprimir</button>
            </div>
            <div className="grid-2" style={{ gap:12 }}>
              {catGas.map(cat => (
                <div key={cat.id} className="form-group">
                  <label className="form-label">{cat.nombre}</label>
                  <input
                    type="number"
                    value={presupuesto[cat.id] || ''}
                    onChange={e => setPresupuesto({...presupuesto, [cat.id]: e.target.value})}
                    className="form-input"
                    placeholder="0"
                    min="0"
                  />
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:10, marginTop:16 }}>
              <button className="btn btn-gold" onClick={guardarPresupuesto}>Guardar presupuesto</button>
              <button className="btn" style={{background:"var(--red)",color:"white"}} onClick={limpiarPresupuesto}>Eliminar presupuesto</button>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontFamily:'var(--font-heading)', fontSize:15, fontWeight:600, marginBottom:14 }}>Seguimiento del presupuesto {anio}</h3>
            {loading ? (
              <div style={{ textAlign:'center', padding:30 }}><span className="spinner" /></div>
            ) : gastoPorCategoria.length === 0 ? (
              <p style={{ color:'var(--text-muted)', fontSize:13 }}>No hay datos de gastos aún.</p>
            ) : gastoPorCategoria.map(cat => (
              <div key={cat.id} style={{ marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontWeight:600 }}>{cat.nombre}</span>
                  <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                    <span style={{ color:'var(--red)', fontSize:13 }}>Gastado: {fmt(cat.total)}</span>
                    {cat.pres > 0 && <span style={{ color:'var(--text-muted)', fontSize:13 }}>Presupuesto: {fmt(cat.pres)}</span>}
                    {cat.excedido && <span style={{ background:'var(--red)', color:'#fff', fontSize:11, fontWeight:700, borderRadius:4, padding:'2px 8px' }}>Excedido</span>}
                  </div>
                </div>
                {cat.pres > 0 && (
                  <div style={{ height:8, background:'var(--border)', borderRadius:4 }}>
                    <div style={{
                      width:`${cat.porcentaje}%`, height:'100%', borderRadius:4,
                      background: cat.excedido ? 'var(--red)' : cat.porcentaje > 80 ? 'var(--gold)' : 'var(--green)',
                      transition:'width 0.3s'
                    }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'deudas' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            {totalDeudas > 0 && (
              <div className="stat-card" style={{ flex:'0 0 auto', padding:'12px 20px' }}>
                <div className="stat-value text-red" style={{ fontSize:20 }}>{fmt(totalDeudas)}</div>
                <div className="stat-label">Total pendiente</div>
              </div>
            )}
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-ghost" style={{ fontSize:13 }} onClick={imprimirDeudas}>🖨️ Imprimir</button>
              <button className="btn btn-gold" onClick={() => { setFormDeuda({ descripcion:'', monto_total:'', monto_pagado:'0', fecha_inicio:'', fecha_vencimiento:'', estado:'pendiente', notas:'' }); setEditDeuda(null); setModalDeuda(true) }}>
              + Nuevo compromiso
            </button>
            </div>
          </div>

          {deudas.length === 0 ? (
            <div className="card" style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
              <p>No hay deudas o compromisos registrados.</p>
            </div>
          ) : deudas.map((d, i) => {
            const pendiente = parseFloat(d.monto_total||0) - parseFloat(d.monto_pagado||0)
            const porcentaje = parseFloat(d.monto_total) > 0 ? Math.round((parseFloat(d.monto_pagado)/parseFloat(d.monto_total))*100) : 0
            return (
              <div key={d.id} className="card" style={{ marginBottom:12, borderLeft:`3px solid ${ESTADO_BADGE[d.estado]?.color || 'var(--gold)'}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                      <span style={{ background: ESTADO_BADGE[d.estado]?.color, color:'#fff', fontSize:11, fontWeight:700, borderRadius:4, padding:'2px 8px' }}>
                        {ESTADO_BADGE[d.estado]?.label}
                      </span>
                      {d.fecha_vencimiento && (
                        <span style={{ color:'var(--text-muted)', fontSize:12 }}>
                          Vence: {new Date(d.fecha_vencimiento).toLocaleDateString('es-DO')}
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontFamily:'var(--font-heading)', fontSize:15, fontWeight:700, marginBottom:8 }}>{d.descripcion}</h3>
                    <div style={{ display:'flex', gap:20, marginBottom:8 }}>
                      <span style={{ fontSize:13 }}>Total: <strong>{fmt(d.monto_total)}</strong></span>
                      <span style={{ fontSize:13 }}>Pagado: <strong style={{ color:'var(--green)' }}>{fmt(d.monto_pagado)}</strong></span>
                      <span style={{ fontSize:13 }}>Pendiente: <strong style={{ color:'var(--red)' }}>{fmt(pendiente)}</strong></span>
                    </div>
                    {parseFloat(d.monto_total) > 0 && (
                      <div style={{ height:6, background:'var(--border)', borderRadius:3, maxWidth:300 }}>
                        <div style={{ width:`${porcentaje}%`, height:'100%', borderRadius:3, background:'var(--green)' }} />
                      </div>
                    )}
                    {d.notas && <p style={{ color:'var(--text-muted)', fontSize:13, marginTop:8 }}>{d.notas}</p>}
                  </div>
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    <button className="btn btn-ghost" style={{ padding:'5px 10px', fontSize:12 }} onClick={() => editarDeuda(i)}>Editar</button>
                    <button className="btn btn-danger" style={{ padding:'5px 10px', fontSize:12 }} onClick={() => eliminarDeuda(d.id)}>✕</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modalDeuda && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalDeuda(false)}>
          <div className="modal" style={{ maxWidth:520 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editDeuda !== null ? 'Editar compromiso' : 'Nuevo compromiso'}</h3>
              <button className="modal-close" onClick={() => setModalDeuda(false)}>×</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div className="form-group">
                <label className="form-label">Descripcion *</label>
                <input value={formDeuda.descripcion} onChange={e=>setFormDeuda({...formDeuda,descripcion:e.target.value})} className="form-input" placeholder="Ej: Prestamo para sonido" />
              </div>
              <div className="grid-2" style={{ gap:12 }}>
                <div className="form-group">
                  <label className="form-label">Monto total (DOP) *</label>
                  <input type="number" value={formDeuda.monto_total} onChange={e=>setFormDeuda({...formDeuda,monto_total:e.target.value})} className="form-input" min="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Monto pagado (DOP)</label>
                  <input type="number" value={formDeuda.monto_pagado} onChange={e=>setFormDeuda({...formDeuda,monto_pagado:e.target.value})} className="form-input" min="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha inicio</label>
                  <DatePicker name="fecha_inicio" value={formDeuda.fecha_inicio} onChange={e=>setFormDeuda({...formDeuda,fecha_inicio:e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha vencimiento</label>
                  <DatePicker name="fecha_vencimiento" value={formDeuda.fecha_vencimiento} onChange={e=>setFormDeuda({...formDeuda,fecha_vencimiento:e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Estado</label>
                <select value={formDeuda.estado} onChange={e=>setFormDeuda({...formDeuda,estado:e.target.value})} className="form-input">
                  <option value="pendiente">Pendiente</option>
                  <option value="parcial">Pago parcial</option>
                  <option value="completado">Completado</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notas</label>
                <textarea value={formDeuda.notas} onChange={e=>setFormDeuda({...formDeuda,notas:e.target.value})} className="form-input" rows={3} style={{ resize:'vertical' }} />
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setModalDeuda(false)}>Cancelar</button>
                <button className="btn btn-gold" onClick={guardarDeuda}>
                  {editDeuda !== null ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



