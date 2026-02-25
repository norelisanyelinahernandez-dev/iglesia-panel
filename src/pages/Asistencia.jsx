import { useState, useEffect } from 'react'
import Toast from '../components/Toast'
import DatePicker from '../components/DatePicker'
import { getMiembros } from '../api/client'

const STORAGE_KEY = 'asistencia_iglesia'

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


const TIPOS = [
  'Culto de avivamiento',
  'Estudio bíblico',
  'Escuela de niños',
  'Celula',
  'Retiro congregacional',
  'Culto unido',
  'Otro',
]

const hoy = () => new Date().toISOString().split('T')[0]

export default function Asistencia() {
  const [confirmDel, setConfirmDel] = useState(null)
  const handleDelete = async () => {
    if (!confirmDel) return
    try { await deleteAsistencia(confirmDel); setConfirmDel(null); load() } catch(_) { mostrarError('No se pudo eliminar.') }
  }

  const [toast, setToast] = useState(null)
  const mostrarError = (msg) => setToast({ mensaje: msg, tipo: 'error' })
  const [miembros, setMiembros] = useState([])
  const [registros, setRegistros] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] }
    catch { return [] }
  })
  const [tab, setTab] = useState('registrar')
  const [fecha, setFecha] = useState(hoy())
  const [tipo, setTipo] = useState('Culto de avivamiento')
  const [presentes, setPresentes] = useState({})
  const [buscar, setBuscar] = useState('')
  const [guardado, setGuardado] = useState(false)
  const [loading, setLoading] = useState(true)
  const [verRegistro, setVerRegistro] = useState(null)

  useEffect(() => {
    getMiembros({ limit:500 }).then(r => {
      const activos = r.data.filter(m => m.estado === 'activo')
      setMiembros(activos)
      const init = {}
      activos.forEach(m => init[m.id] = false)
      setPresentes(init)
    }).catch(()=>{}).finally(()=>setLoading(false))
  }, [])

  const toggleTodos = (val) => {
    const nuevo = {}
    miembros.forEach(m => nuevo[m.id] = val)
    setPresentes(nuevo)
  }

  const guardar = () => {
    const listaPresentes = miembros.filter(m => presentes[m.id]).map(m => ({ id:m.id, nombre:`${m.nombres} ${m.apellidos}` }))
    const registro = {
      id: Date.now(),
      fecha,
      tipo,
      total_miembros: miembros.length,
      total_presentes: listaPresentes.length,
      presentes: listaPresentes,
    }
    const nuevos = [registro, ...registros]
    setRegistros(nuevos)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevos))
    setGuardado(true)
    setTimeout(() => setGuardado(false), 3000)
    const init = {}
    miembros.forEach(m => init[m.id] = false)
    setPresentes(init)
  }

  const eliminarRegistro = (id) => {
    setConfirmDel(id); return // modal
    if (!confirmDel) return
    const nuevos = registros.filter(r => r.id !== id)
    setRegistros(nuevos)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevos))
    setVerRegistro(null)
  }

  const miembrosFiltrados = miembros.filter(m =>
    `${m.nombres} ${m.apellidos}`.toLowerCase().includes(buscar.toLowerCase())
  )

  const totalPresentes = miembros.filter(m => presentes[m.id]).length

  const resumenMiembros = miembros.map(m => {
    const total = registros.length
    const asistio = registros.filter(r => r.presentes.some(p => p.id === m.id)).length
    const porcentaje = total > 0 ? Math.round((asistio / total) * 100) : 0
    return { ...m, asistio, total, porcentaje }
  }).sort((a, b) => a.porcentaje - b.porcentaje)


  const imprimirResumen = () => {
    const filas = resumenMiembros.map(m => {
      const color = m.porcentaje > 70 ? 'badge-green' : m.porcentaje > 40 ? 'badge-amber' : 'badge-red'
      const estado = m.porcentaje > 70 ? 'Regular' : m.porcentaje > 40 ? 'Irregular' : 'Ausente frecuente'
      return `<tr>
        <td>${m.nombres} ${m.apellidos}</td>
        <td style="text-align:center">${m.asistio}</td>
        <td style="text-align:center">${m.total}</td>
        <td style="text-align:center"><strong>${m.porcentaje}%</strong></td>
        <td><span class="badge ${color}">${estado}</span></td>
      </tr>`
    }).join('')
    const html = `
      <div class="stat-row">
        <div class="stat-box"><div class="val">${registros.length}</div><div class="lbl">Cultos registrados</div></div>
        <div class="stat-box"><div class="val">${miembros.length}</div><div class="lbl">Miembros activos</div></div>
      </div>
      <h2>Resumen de Asistencia por Miembro</h2>
      <table>
        <thead><tr><th>Miembro</th><th>Asistencias</th><th>Total cultos</th><th>%</th><th>Estado</th></tr></thead>
        <tbody>${filas}</tbody>
      </table>`
    imprimirConEncabezado('Resumen de Asistencia', html)
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Asistencia</h1>
          <p className="page-subtitle">{registros.length} registros guardados</p>
        </div>
      </div>

      <div style={{ display:'flex', gap:4, marginBottom:20, borderBottom:'1px solid var(--border)' }}>
        {[['registrar','Registrar asistencia'],['historial','Historial'],['resumen','Resumen por miembro']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ background:'none', border:'none', cursor:'pointer', padding:'8px 18px',
              color: tab===id ? 'var(--gold)' : 'var(--text-muted)',
              borderBottom: tab===id ? '2px solid var(--gold)' : '2px solid transparent',
              fontSize:14, fontWeight:500, fontFamily:'var(--font-body)'
            }}
          >{label}</button>
        ))}
      </div>

      {tab === 'registrar' && (
        <div>
          {guardado && <div className="alert alert-success" style={{ marginBottom:16 }}>Asistencia guardada correctamente</div>}
          <div className="card" style={{ marginBottom:16 }}>
            <div className="grid-2" style={{ gap:12 }}>
              <div className="form-group">
                <label className="form-label">Fecha</label>
                <DatePicker name="fecha" value={fecha} onChange={e=>setFecha(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Tipo de actividad</label>
                <select value={tipo} onChange={e=>setTipo(e.target.value)} className="form-input">
                  {TIPOS.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:10 }}>
              <div>
                <span style={{ fontWeight:600 }}>Presentes: </span>
                <span style={{ color:'var(--gold)', fontWeight:700, fontSize:18 }}>{totalPresentes}</span>
                <span style={{ color:'var(--text-muted)' }}> / {miembros.length}</span>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn btn-ghost" style={{ fontSize:13 }} onClick={() => toggleTodos(true)}>Marcar todos</button>
                <button className="btn btn-ghost" style={{ fontSize:13 }} onClick={() => toggleTodos(false)}>Desmarcar todos</button>
              </div>
            </div>

            <div className="search-bar" style={{ marginBottom:14 }}>
              <span className="search-icon">⌕</span>
              <input placeholder="Buscar miembro..." value={buscar} onChange={e=>setBuscar(e.target.value)} />
            </div>

            {loading ? (
              <div style={{ textAlign:'center', padding:30 }}><span className="spinner" /></div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:400, overflowY:'auto' }}>
                {miembrosFiltrados.map(m => (
                  <div key={m.id} onClick={() => setPresentes({...presentes, [m.id]: !presentes[m.id]})}
                    style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:8, cursor:'pointer',
                      background: presentes[m.id] ? 'rgba(var(--gold-rgb),0.1)' : 'var(--bg-card)',
                      border: presentes[m.id] ? '1px solid var(--gold)' : '1px solid var(--border)',
                      transition:'all 0.15s'
                    }}>
                    <div style={{ width:22, height:22, borderRadius:4, border:`2px solid ${presentes[m.id] ? 'var(--gold)' : 'var(--border)'}`,
                      background: presentes[m.id] ? 'var(--gold)' : 'transparent',
                      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {presentes[m.id] && <span style={{ color:'#000', fontSize:14, fontWeight:700 }}>✓</span>}
                    </div>
                    <span style={{ fontWeight: presentes[m.id] ? 600 : 400 }}>{m.nombres} {m.apellidos}</span>
                    <span className={`badge ${presentes[m.id] ? 'badge-green' : ''}`} style={{ marginLeft:'auto', fontSize:11 }}>
                      {presentes[m.id] ? 'Presente' : 'Ausente'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button className="btn btn-gold" onClick={guardar} style={{ width:'100%', marginTop:16, justifyContent:'center' }}>
              Guardar asistencia
            </button>
          </div>
        </div>
      )}

      {tab === 'historial' && (
        <div className="card">
          {registros.length === 0 ? (
            <p style={{ color:'var(--text-muted)', textAlign:'center', padding:30 }}>No hay registros de asistencia aun.</p>
          ) : registros.map(r => (
            <div key={r.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0', borderBottom:'1px solid var(--border)', flexWrap:'wrap', gap:8 }}>
              <div>
                <div style={{ fontWeight:600 }}>{r.tipo}</div>
                <div style={{ color:'var(--text-muted)', fontSize:13 }}>{new Date(r.fecha).toLocaleDateString('es-DO', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontWeight:700, fontSize:20, color:'var(--gold)' }}>{r.total_presentes}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>de {r.total_miembros}</div>
                </div>
                <div style={{ width:50, height:50, borderRadius:'50%', background:'var(--bg-card)',
                  border:`3px solid ${r.total_presentes/r.total_miembros > 0.7 ? 'var(--green)' : r.total_presentes/r.total_miembros > 0.4 ? 'var(--gold)' : 'var(--red)'}`,
                  display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13 }}>
                  {Math.round(r.total_presentes/r.total_miembros*100)}%
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <button className="btn btn-ghost" style={{ fontSize:12, padding:'4px 10px' }} onClick={() => setVerRegistro(r)}>Ver</button>
                  <button className="btn btn-danger" style={{ fontSize:12, padding:'4px 10px' }} onClick={() => eliminarRegistro(r.id)}>✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'resumen' && (
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <p style={{ color:'var(--text-muted)', fontSize:13 }}>Basado en {registros.length} registros. Los miembros con menor asistencia aparecen primero.</p>
            <button className="btn btn-ghost" style={{ fontSize:13 }} onClick={imprimirResumen}>🖨️ Imprimir</button>
          </div>
          {resumenMiembros.length === 0 ? (
            <p style={{ color:'var(--text-muted)', textAlign:'center', padding:30 }}>No hay datos aun.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Miembro</th>
                    <th>Asistencias</th>
                    <th>Total cultos</th>
                    <th>Porcentaje</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {resumenMiembros.map(m => (
                    <tr key={m.id}>
                      <td style={{ fontWeight:500 }}>{m.nombres} {m.apellidos}</td>
                      <td style={{ color:'var(--gold)', fontWeight:600 }}>{m.asistio}</td>
                      <td style={{ color:'var(--text-muted)' }}>{m.total}</td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ flex:1, height:6, background:'var(--border)', borderRadius:3 }}>
                            <div style={{ width:`${m.porcentaje}%`, height:'100%', borderRadius:3,
                              background: m.porcentaje > 70 ? 'var(--green)' : m.porcentaje > 40 ? 'var(--gold)' : 'var(--red)' }} />
                          </div>
                          <span style={{ fontSize:13, fontWeight:600, minWidth:35 }}>{m.porcentaje}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${m.porcentaje > 70 ? 'badge-green' : m.porcentaje > 40 ? 'badge-amber' : 'badge-red'}`}>
                          {m.porcentaje > 70 ? 'Regular' : m.porcentaje > 40 ? 'Irregular' : 'Ausente frecuente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {verRegistro && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setVerRegistro(null)}>
          <div className="modal" style={{ maxWidth:500 }}>
            <div className="modal-header">
              <h3 className="modal-title">{verRegistro.tipo} — {new Date(verRegistro.fecha).toLocaleDateString('es-DO')}</h3>
              <button className="modal-close" onClick={() => setVerRegistro(null)}>×</button>
            </div>
            <p style={{ color:'var(--text-muted)', fontSize:13, marginBottom:14 }}>
              {verRegistro.total_presentes} de {verRegistro.total_miembros} miembros presentes
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:300, overflowY:'auto' }}>
              {verRegistro.presentes.map(p => (
                <div key={p.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'var(--bg-card)', borderRadius:8 }}>
                  <span style={{ color:'var(--green)', fontWeight:700 }}>✓</span>
                  <span>{p.nombre}</span>
                </div>
              ))}
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
              <h3 style={{ fontFamily:'var(--font-heading)', fontSize:18, marginBottom:8 }}>&#x00BF;Eliminar registro?</h3>
              <p style={{ color:'var(--text-muted)', fontSize:13 }}>Esta acci&#x00F3;n no se puede deshacer.</p>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:16 }}>
              <button className="btn btn-ghost" style={{ flex:1 }} onClick={() => setConfirmDel(null)}>Cancelar</button>
              <button className="btn btn-danger" style={{ flex:1, justifyContent:'center' }} onClick={handleDelete}>S&#x00ED;, eliminar</button>
            </div>
          </div>
        </div>
      )}


    </div>
  )
}




