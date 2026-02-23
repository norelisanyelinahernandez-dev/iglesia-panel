import { useState, useEffect } from 'react'
import DatePicker from '../components/DatePicker'
import { getMiembros } from '../api/client'

const STORAGE_KEY = 'asistencia_iglesia'

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
    if (!confirm('¿Eliminar este registro?')) return
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
          <p style={{ color:'var(--text-muted)', fontSize:13, marginBottom:16 }}>Basado en {registros.length} registros. Los miembros con menor asistencia aparecen primero.</p>
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
    </div>
  )
}




