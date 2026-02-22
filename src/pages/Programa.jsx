import { useState, useEffect } from 'react'
import { getMiembros } from '../api/client'

const DIAS = ['Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo']

const TIPOS = [
  'Culto de avivamiento',
  'Estudio biblico',
  'Escuela de ninos',
  'Visita a enfermos',
  'Celula',
  'Retiro congregacional',
  'Culto unido',
]

const PARTES_POR_TIPO = {
  'Culto de avivamiento': ['Oracion de apertura','Direccion','Devocional','Alabanzas','Mensaje','Oracion de cierre'],
  'Celula': ['Oracion de apertura','Direccion','Devocional','Alabanzas','Mensaje','Oracion de cierre'],
  'Estudio biblico': ['Oracion de apertura','Encargado del estudio'],
  'Escuela de ninos': ['Encargado'],
  'Visita a enfermos': [],
  'Retiro congregacional': [],
  'Culto unido': [],
}

const VERSICULOS = [
  { texto: 'No dejando de congregarnos, como algunos tienen por costumbre, sino exhortandonos.', ref: 'Hebreos 10:25' },
  { texto: 'Porque donde estan dos o tres congregados en mi nombre, alli estoy yo en medio de ellos.', ref: 'Mateo 18:20' },
  { texto: 'Yo me alegre con los que me decian: A la casa de Jehova iremos.', ref: 'Salmos 122:1' },
  { texto: 'Una cosa he demandado a Jehova, esta buscara; que este yo en la casa de Jehova todos los dias de mi vida.', ref: 'Salmos 27:4' },
  { texto: 'Y perseveraban en la doctrina de los apostoles, en la comunion unos con otros, en el partimiento del pan y en las oraciones.', ref: 'Hechos 2:42' },
  { texto: 'Engrandezcan a Jehova conmigo, y exaltemos su nombre a una.', ref: 'Salmos 34:3' },
  { texto: 'Cantad a Jehova cantico nuevo; su alabanza sea en la congregacion de los santos.', ref: 'Salmos 149:1' },
]

const getNumSemana = (fecha) => {
  const d = new Date(fecha)
  d.setHours(0,0,0,0)
  d.setDate(d.getDate() + 4 - (d.getDay()||7))
  const yearStart = new Date(d.getFullYear(),0,1)
  return `${d.getFullYear()}-W${Math.ceil((((d-yearStart)/86400000)+1)/7).toString().padStart(2,'0')}`
}

const semanaActual = () => getNumSemana(new Date())

const emptyDia = (dia) => ({ dia, tipo:'', hora:'', lugar:'', encargado:'', partes:{}, pastor_visita:'', congregacion_visita:'' })
const emptyParte = () => ({ tipo_asignado:'miembro', miembro_id:'', pastor_externo:'', congregacion_externa:'' })

function ParteRow({ label, parte, onChange, miembros }) {
  const p = parte || emptyParte()
  const h = (field, val) => onChange({ ...p, [field]: val })
  return (
    <div style={{ background:'var(--bg-card)', borderRadius:8, padding:'10px 14px', marginBottom:8 }}>
      <div style={{ fontWeight:600, fontSize:13, marginBottom:8, color:'var(--gold)' }}>{label}</div>
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'flex-end' }}>
        <div className="form-group" style={{ minWidth:180, flex:1 }}>
          <label className="form-label">Asignado a</label>
          <select value={p.tipo_asignado} onChange={e=>h('tipo_asignado',e.target.value)} className="form-input">
            <option value="miembro">Miembro de la iglesia</option>
            <option value="externo">Miembro de otra congregacion</option>
          </select>
        </div>
        {p.tipo_asignado === 'miembro' ? (
          <div className="form-group" style={{ minWidth:180, flex:2 }}>
            <label className="form-label">Miembro</label>
            <select value={p.miembro_id} onChange={e=>h('miembro_id',e.target.value)} className="form-input">
              <option value="">-- Seleccionar --</option>
              {miembros.map(m=><option key={m.id} value={m.id}>{m.nombres} {m.apellidos}</option>)}
            </select>
          </div>
        ) : (
          <>
            <div className="form-group" style={{ minWidth:150, flex:1 }}>
              <label className="form-label">Nombre del pastor</label>
              <input value={p.pastor_externo} onChange={e=>h('pastor_externo',e.target.value)} className="form-input" placeholder="Nombre" />
            </div>
            <div className="form-group" style={{ minWidth:150, flex:1 }}>
              <label className="form-label">Congregacion</label>
              <input value={p.congregacion_externa} onChange={e=>h('congregacion_externa',e.target.value)} className="form-input" placeholder="Nombre congregacion" />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function DiaCard({ diaData, onChange, miembros, readonly }) {
  const [expandido, setExpandido] = useState(false)
  const d = diaData
  const h = (field, val) => onChange({ ...d, [field]: val })
  const partes = PARTES_POR_TIPO[d.tipo] || []
  const esRetiroOUnido = d.tipo === 'Retiro congregacional' || d.tipo === 'Culto unido'

  return (
    <div className="card" style={{ marginBottom:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }} onClick={() => setExpandido(!expandido)}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ background:'var(--gold)', color:'#000', fontWeight:700, fontSize:13, borderRadius:6, padding:'4px 12px', minWidth:90, textAlign:'center' }}>{d.dia}</div>
          {d.tipo ? <span style={{ color:'var(--text-muted)', fontSize:13 }}>{d.tipo} {d.hora ? `- ${d.hora}` : ''}</span> : <span style={{ color:'var(--text-muted)', fontSize:13 }}>Sin actividad</span>}
        </div>
        <span style={{ color:'var(--text-muted)', fontSize:18 }}>{expandido ? 'A' : 'V'}</span>
      </div>

      {expandido && (
        <div style={{ marginTop:16 }}>
          {!readonly && (
            <div className="grid-2" style={{ gap:12, marginBottom:12 }}>
              <div className="form-group">
                <label className="form-label">Tipo de actividad</label>
                <select value={d.tipo} onChange={e=>h('tipo',e.target.value)} className="form-input">
                  <option value="">-- Sin actividad --</option>
                  {TIPOS.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Hora</label>
                <input type="time" value={d.hora} onChange={e=>h('hora',e.target.value)} className="form-input" />
              </div>
              {!esRetiroOUnido && (
                <div className="form-group">
                  <label className="form-label">Lugar</label>
                  <input value={d.lugar} onChange={e=>h('lugar',e.target.value)} className="form-input" placeholder="Ej: Templo principal" />
                </div>
              )}
              {esRetiroOUnido && (
                <>
                  <div className="form-group">
                    <label className="form-label">Pastor</label>
                    <input value={d.pastor_visita} onChange={e=>h('pastor_visita',e.target.value)} className="form-input" placeholder="Nombre del pastor" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Lugar</label>
                    <input value={d.lugar} onChange={e=>h('lugar',e.target.value)} className="form-input" placeholder="Lugar del evento" />
                  </div>
                </>
              )}
            </div>
          )}

          {readonly && d.tipo && (
            <div style={{ marginBottom:12, color:'var(--text-muted)', fontSize:13 }}>
              {d.lugar && <div>Lugar: {d.lugar}</div>}
              {d.pastor_visita && <div>Pastor: {d.pastor_visita}</div>}
            </div>
          )}

          {partes.length > 0 && (
            <div style={{ marginTop:8 }}>
              <div style={{ fontWeight:600, fontSize:13, marginBottom:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:1 }}>Partes del programa</div>
              {partes.map(parte => (
                readonly ? (
                  <div key={parte} style={{ background:'var(--bg-card)', borderRadius:8, padding:'8px 14px', marginBottom:6, display:'flex', justifyContent:'space-between' }}>
                    <span style={{ color:'var(--gold)', fontWeight:600, fontSize:13 }}>{parte}</span>
                    <span style={{ fontSize:13 }}>
                      {d.partes[parte]?.tipo_asignado === 'externo'
                        ? `${d.partes[parte]?.pastor_externo} (${d.partes[parte]?.congregacion_externa})`
                        : miembros.find(m=>m.id===d.partes[parte]?.miembro_id) ? `${miembros.find(m=>m.id===d.partes[parte]?.miembro_id).nombres} ${miembros.find(m=>m.id===d.partes[parte]?.miembro_id).apellidos}` : '--'
                      }
                    </span>
                  </div>
                ) : (
                  <ParteRow key={parte} label={parte} parte={d.partes[parte]} miembros={miembros} onChange={val => h('partes', { ...d.partes, [parte]: val })} />
                )
              ))}
            </div>
          )}

          {d.tipo === 'Visita a enfermos' && !readonly && (
            <div className="form-group">
              <label className="form-label">Encargado de la visita</label>
              <select value={d.encargado} onChange={e=>h('encargado',e.target.value)} className="form-input">
                <option value="">-- Seleccionar --</option>
                {miembros.map(m=><option key={m.id} value={m.id}>{m.nombres} {m.apellidos}</option>)}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Programa() {
  const [miembros, setMiembros] = useState([])
  const [semanaViendo, setSemanaViendo] = useState(semanaActual())
  const [programas, setProgramas] = useState(() => {
    try { return JSON.parse(localStorage.getItem('programas_semanales')) || {} }
    catch { return {} }
  })
  const [guardado, setGuardado] = useState(false)
  const [vistaHistorial, setVistaHistorial] = useState(false)
  const versiculo = VERSICULOS[new Date().getDay() % VERSICULOS.length]
  const esActual = semanaViendo === semanaActual()

  const semanaData = programas[semanaViendo] || DIAS.map(emptyDia)

  useEffect(() => {
    getMiembros({ limit:200 }).then(r => setMiembros(r.data)).catch(()=>{})
  }, [])

  const updateDia = (index, data) => {
    const nueva = [...semanaData]
    nueva[index] = data
    const nuevos = { ...programas, [semanaViendo]: nueva }
    setProgramas(nuevos)
    localStorage.setItem('programas_semanales', JSON.stringify(nuevos))
  }

  const guardar = () => {
    localStorage.setItem('programas_semanales', JSON.stringify(programas))
    setGuardado(true)
    setTimeout(() => setGuardado(false), 3000)
  }

  const limpiar = () => {
    if (!confirm('Deseas limpiar el programa de esta semana?')) return
    const nuevos = { ...programas, [semanaViendo]: DIAS.map(emptyDia) }
    setProgramas(nuevos)
    localStorage.setItem('programas_semanales', JSON.stringify(nuevos))
  }

  const semanasSaved = Object.keys(programas).sort().reverse()

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Programa Semanal</h1>
          <p className="page-subtitle">Ministerio San Juan 7:38 - Del Semillero 1/11</p>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <button className="btn btn-ghost" onClick={() => setVistaHistorial(!vistaHistorial)}>
            {vistaHistorial ? 'Ver actual' : 'Historial'}
          </button>
          {esActual && <button className="btn btn-ghost" onClick={limpiar}>Limpiar</button>}
          {esActual && <button className="btn btn-ghost" onClick={() => window.print()}>Imprimir</button>}
          {esActual && <button className="btn btn-gold" onClick={guardar}>Guardar</button>}
        </div>
      </div>

      {guardado && <div className="alert alert-success" style={{ marginBottom:16 }}>Programa guardado correctamente</div>}

      {vistaHistorial ? (
        <div className="card">
          <h3 style={{ fontFamily:'var(--font-heading)', fontSize:16, fontWeight:600, marginBottom:16 }}>Historial de programas</h3>
          {semanasSaved.length === 0 ? (
            <p style={{ color:'var(--text-muted)' }}>No hay programas guardados aun.</p>
          ) : semanasSaved.map(semana => (
            <div key={semana} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
              <span style={{ fontWeight:500 }}>Semana: {semana}</span>
              <button className="btn btn-ghost" style={{ fontSize:13 }} onClick={() => { setSemanaViendo(semana); setVistaHistorial(false) }}>
                Ver programa
              </button>
            </div>
          ))}
        </div>
      ) : (
        <>
          {!esActual && (
            <div style={{ background:'var(--bg-card)', border:'1px solid var(--gold)', borderRadius:8, padding:'10px 16px', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ color:'var(--gold)', fontWeight:600 }}>Viendo semana anterior: {semanaViendo}</span>
              <button className="btn btn-ghost" style={{ fontSize:13 }} onClick={() => setSemanaViendo(semanaActual())}>Volver a la semana actual</button>
            </div>
          )}

          <div className="card" style={{ marginBottom:20, borderLeft:'3px solid var(--gold)' }}>
            <p style={{ fontStyle:'italic', fontSize:14, marginBottom:4 }}>"{versiculo.texto}"</p>
            <span style={{ color:'var(--gold)', fontSize:12, fontWeight:600 }}>-- {versiculo.ref}</span>
          </div>

          {semanaData.map((d, i) => (
            <DiaCard key={d.dia} diaData={d} index={i} onChange={data => updateDia(i, data)} miembros={miembros} readonly={!esActual} />
          ))}
        </>
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
