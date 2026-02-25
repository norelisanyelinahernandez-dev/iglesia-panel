import { useState, useEffect } from 'react'
import Toast from '../components/Toast'
import { usePermisos } from '../context/PermisosContext'
import { getMiembros, getPrograma, savePrograma, getProgramaSemanas } from '../api/client'

const DIAS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']

const TIPOS = [
  'Culto de avivamiento',
  'Estudio bíblico',
  'Escuela de niños',
  'Visita a enfermos',
  'Celula',
  'Retiro congregacional',
  'Culto unido',
]

const ICONOS_TIPO = {
  'Culto de avivamiento': '🔥',
  'Estudio bíblico': '📖',
  'Escuela de niños': '👧',
  'Visita a enfermos': '🏥',
  'Celula': '🏠',
  'Retiro congregacional': '⛺',
  'Culto unido': '🤝',
  '': '📅',
}

const PARTES_POR_TIPO = {
  'Culto de avivamiento': ['Oracion de apertura','Direccion','Devocional','Alabanzas','Mensaje','Oracion de cierre'],
  'Celula': ['Oracion de apertura','Direccion','Devocional','Alabanzas','Mensaje','Oracion de cierre'],
  'Estudio bíblico': ['Oracion de apertura','Encargado del estudio'],
  'Escuela de niños': ['Encargado'],
  'Visita a enfermos': [],
  'Retiro congregacional': [],
  'Culto unido': [],
}

const VERSICULOS = [
  { texto: 'No dejando de congregarnos, como algunos tienen por costumbre, sino exhortándonos.', ref: 'Hebreos 10:25' },
  { texto: 'Porque donde están dos o tres congregados en mi nombre, alli estoy yo en medio de ellos.', ref: 'Mateo 18:20' },
  { texto: 'Yo me alegre con los que me decían: A la casa de Jehova iremos.', ref: 'Salmos 122:1' },
  { texto: 'Una cosa he demandado a Jehova; que este yo en la casa de Jehova todos los dias de mi vida.', ref: 'Salmos 27:4' },
  { texto: 'Y perseveraban en la doctrina de los apóstoles, en la comunión unos con otros, en el partimiento del pan y en las oraciones.', ref: 'Hechos 2:42' },
  { texto: 'Engrandezcan a Jehová conmigo, y exaltemos su nombre a una.', ref: 'Salmos 34:3' },
  { texto: 'Cantad a Jehová cántico nuevo; su alabanza sea en la congregación de los santos.', ref: 'Salmos 149:1' },
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

const hablar = (texto) => {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(texto)
  u.lang = 'es-ES'
  u.rate = 0.9
  window.speechSynthesis.speak(u)
}

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

function DiaCardSimple({ diaData, miembros, onEscuchar }) {
  const d = diaData
  const partes = PARTES_POR_TIPO[d.tipo] || []
  const icono = ICONOS_TIPO[d.tipo] || '📅'

  const getNombre = (parte) => {
    const p = d.partes[parte]
    if (!p) return 'Por asignar'
    if (p.tipo_asignado === 'externo') return `${p.pastor_externo || 'Pastor externo'} de ${p.congregacion_externa || 'otra congregacion'}`
    const m = miembros.find(m=>m.id===p.miembro_id)
    return m ? `${m.nombres} ${m.apellidos}` : 'Por asignar'
  }

  if (!d.tipo) return (
    <div style={{ background:'var(--bg-card)', borderRadius:16, padding:20, marginBottom:12, display:'flex', alignItems:'center', gap:16, opacity:0.5 }}>
      <span style={{ fontSize:40 }}>📅</span>
      <div>
        <div style={{ fontWeight:700, fontSize:18 }}>{d.dia}</div>
        <div style={{ color:'var(--text-muted)', fontSize:14 }}>Sin actividad</div>
      </div>
    </div>
  )

  return (
    <div style={{ background:'var(--bg-card)', borderRadius:16, padding:20, marginBottom:12, border:'2px solid var(--gold)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:partes.length>0?14:0 }}>
        <span style={{ fontSize:48 }}>{icono}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:22 }}>{d.dia}</div>
          <div style={{ color:'var(--gold)', fontWeight:600, fontSize:16 }}>{d.tipo}</div>
          {d.hora && <div style={{ color:'var(--text-muted)', fontSize:14 }}>Hora: {d.hora}</div>}
          {d.lugar && <div style={{ color:'var(--text-muted)', fontSize:14 }}>Lugar: {d.lugar}</div>}
          {d.pastor_visita && <div style={{ color:'var(--text-muted)', fontSize:14 }}>Pastor: {d.pastor_visita}</div>}
        </div>
        <button onClick={() => onEscuchar(d, getNombre)}
          style={{ background:'var(--gold)', border:'none', borderRadius:50, width:56, height:56, fontSize:24, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          🔊
        </button>
      </div>
      {partes.length > 0 && (
        <div style={{ borderTop:'1px solid var(--border)', paddingTop:12 }}>
          {partes.map(parte => (
            <div key={parte} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
              <span style={{ color:'var(--text-muted)', fontSize:14 }}>{parte}</span>
              <span style={{ fontWeight:600, fontSize:14 }}>{getNombre(parte)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DiaCard({ diaData, onChange, miembros }) {
  const [expandido, setExpandido] = useState(false)
  const d = diaData
  const h = (field, val) => onChange({ ...d, [field]: val })
  const partes = PARTES_POR_TIPO[d.tipo] || []
  const esRetiroOUnido = d.tipo === 'Retiro congregacional' || d.tipo === 'Culto unido'
  const icono = ICONOS_TIPO[d.tipo] || '📅'

  return (
    <div className="card" style={{ marginBottom:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }} onClick={() => setExpandido(!expandido)}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:28 }}>{icono}</span>
          <div style={{ background:'var(--gold)', color:'#000', fontWeight:700, fontSize:13, borderRadius:6, padding:'4px 12px', minWidth:90, textAlign:'center' }}>{d.dia}</div>
          {d.tipo ? <span style={{ color:'var(--text-muted)', fontSize:13 }}>{d.tipo} {d.hora ? `- ${d.hora}` : ''}</span> : <span style={{ color:'var(--text-muted)', fontSize:13 }}>Sin actividad</span>}
        </div>
        <span style={{ color:'var(--text-muted)' }}>{expandido ? 'cerrar' : 'abrir'}</span>
      </div>

      {expandido && (
        <div style={{ marginTop:16 }}>
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

          {partes.length > 0 && (
            <div style={{ marginTop:8 }}>
              <div style={{ fontWeight:600, fontSize:13, marginBottom:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:1 }}>Partes del programa</div>
              {partes.map(parte => (
                <ParteRow key={parte} label={parte} parte={d.partes[parte]} miembros={miembros} onChange={val => h('partes', { ...d.partes, [parte]: val })} />
              ))}
            </div>
          )}

          {d.tipo === 'Visita a enfermos' && (
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
  const [toast, setToast] = useState(null)
  const mostrarError = (msg) => setToast({ mensaje: msg, tipo: 'error' })
  const { puedeEditar } = usePermisos()
  const puedeEdit = puedeEditar('programa')
  const [miembros, setMiembros] = useState([])
  const [modoSimple, setModoSimple] = useState(false)
  const [semanaViendo, setSemanaViendo] = useState(semanaActual())
  const [programas, setProgramas] = useState({})
  const [guardado, setGuardado] = useState(false)
  const [vistaHistorial, setVistaHistorial] = useState(false)
  const versiculo = VERSICULOS[new Date().getDay() % VERSICULOS.length]
  const esActual = semanaViendo === semanaActual()
  const semanaData = programas[semanaViendo] || DIAS.map(emptyDia)

  useEffect(() => {
    getMiembros({ limit:200 }).then(r => setMiembros(r.data)).catch(()=>{})
    // Cargar programas desde API
    getProgramaSemanas().then(r => {
      const semanas = r.data || []
      Promise.all(semanas.map(s => getPrograma(s))).then(results => {
        const obj = {}
        results.forEach(r2 => { if (r2.data) obj[r2.data.semana] = r2.data.datos })
        setProgramas(obj)
      })
    }).catch(()=>{})
  }, [])

  const updateDia = (index, data) => {
    const nueva = [...semanaData]
    nueva[index] = data
    const nuevos = { ...programas, [semanaViendo]: nueva }
    setProgramas(nuevos)
  }

  const guardar = async () => {
    try {
      await savePrograma(semanaViendo, semanaData)
      setGuardado(true)
      setTimeout(() => setGuardado(false), 3000)
    } catch(_) { mostrarError('Ocurrio un error inesperado. Intenta de nuevo.') }
  }

  const limpiar = async () => {
    if (!confirm('Deseas limpiar el programa de esta semana?')) return
    const nuevos = { ...programas, [semanaViendo]: DIAS.map(emptyDia) }
    setProgramas(nuevos)
    try { await savePrograma(semanaViendo, DIAS.map(emptyDia)) } catch(_) { mostrarError('Ocurrio un error inesperado. Intenta de nuevo.') }
  }

  const escucharTodo = () => {
    let texto = 'Programa de la semana. '
    semanaData.forEach(d => {
      if (!d.tipo) { texto += `${d.dia}, sin actividad. `; return }
      texto += `${d.dia}, ${d.tipo}`
      if (d.hora) texto += ` a las ${d.hora}`
      if (d.lugar) texto += `, en ${d.lugar}`
      texto += '. '
      const partes = PARTES_POR_TIPO[d.tipo] || []
      partes.forEach(parte => {
        const p = d.partes[parte]
        if (p) {
          const nombre = p.tipo_asignado === 'externo'
            ? `${p.pastor_externo} de ${p.congregacion_externa}`
            : miembros.find(m=>m.id===p.miembro_id) ? `${miembros.find(m=>m.id===p.miembro_id).nombres} ${miembros.find(m=>m.id===p.miembro_id).apellidos}` : 'por asignar'
          texto += `${parte}: ${nombre}. `
        }
      })
    })
    hablar(texto)
  }

  const escucharDia = (d, getNombre) => {
    let texto = `${d.dia}. ${d.tipo}`
    if (d.hora) texto += ` a las ${d.hora}`
    if (d.lugar) texto += `, en ${d.lugar}`
    if (d.pastor_visita) texto += `. Pastor ${d.pastor_visita}`
    texto += '. '
    const partes = PARTES_POR_TIPO[d.tipo] || []
    partes.forEach(parte => { texto += `${parte}: ${getNombre(parte)}. ` })
    hablar(texto)
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
          <button className="btn btn-ghost" onClick={() => setVistaHistorial(!vistaHistorial)}>{vistaHistorial ? 'Ver actual' : 'Historial'}</button>
          {puedeEdit && (
            <button className="btn btn-ghost" onClick={() => { setModoSimple(!modoSimple); window.speechSynthesis?.cancel() }}>
              {modoSimple ? 'Modo admin' : '🔊 Modo facil'}
            </button>
          )}
          {(modoSimple || !puedeEdit) && (
            <button onClick={escucharTodo}
              style={{ background:'var(--gold)', border:'none', borderRadius:8, padding:'8px 20px', fontWeight:700, fontSize:15, cursor:'pointer' }}>
              🔊 Escuchar todo
            </button>
          )}
          {puedeEdit && !modoSimple && esActual && <button className="btn btn-ghost" onClick={limpiar}>Limpiar</button>}
          {puedeEdit && !modoSimple && esActual && <button className="btn btn-ghost" onClick={() => window.print()}>Imprimir</button>}
          {puedeEdit && !modoSimple && esActual && <button className="btn btn-gold" onClick={guardar}>Guardar</button>}
        </div>
      </div>

      {guardado && <div className="alert alert-success" style={{ marginBottom:16 }}>Programa guardado correctamente</div>}

      {modoSimple && (
        <div style={{ background:'var(--gold)', borderRadius:12, padding:'16px 20px', marginBottom:20, display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:32 }}>🔊</span>
          <div>
            <div style={{ fontWeight:700, fontSize:16, color:'#000' }}>Modo facil activado</div>
            <div style={{ fontSize:13, color:'#333' }}>Presiona el boton 🔊 en cada dia para escuchar el programa, o presiona Escuchar todo para oir toda la semana.</div>
          </div>
        </div>
      )}

      {vistaHistorial ? (
        <div className="card">
          <h3 style={{ fontFamily:'var(--font-heading)', fontSize:16, fontWeight:600, marginBottom:16 }}>Historial de programas</h3>
          {semanasSaved.length === 0 ? (
            <p style={{ color:'var(--text-muted)' }}>No hay programas guardados aun.</p>
          ) : semanasSaved.map(semana => (
            <div key={semana} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
              <span style={{ fontWeight:500 }}>Semana: {semana}</span>
              <button className="btn btn-ghost" style={{ fontSize:13 }} onClick={() => { setSemanaViendo(semana); setVistaHistorial(false) }}>Ver programa</button>
            </div>
          ))}
        </div>
      ) : (
        <>
          {!esActual && (
            <div style={{ background:'var(--bg-card)', border:'1px solid var(--gold)', borderRadius:8, padding:'10px 16px', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ color:'var(--gold)', fontWeight:600 }}>Viendo semana anterior: {semanaViendo}</span>
              <button className="btn btn-ghost" style={{ fontSize:13 }} onClick={() => setSemanaViendo(semanaActual())}>Volver a semana actual</button>
            </div>
          )}

          <div className="card" style={{ marginBottom:20, borderLeft:'3px solid var(--gold)' }}>
            <p style={{ fontStyle:'italic', fontSize:14, marginBottom:4 }}>"{versiculo.texto}"</p>
            <span style={{ color:'var(--gold)', fontSize:12, fontWeight:600 }}>-- {versiculo.ref}</span>
          </div>

          {(modoSimple || !puedeEdit)
            ? semanaData.map((d,i) => <DiaCardSimple key={d.dia} diaData={d} miembros={miembros} onEscuchar={escucharDia} />)
            : semanaData.map((d,i) => <DiaCard key={d.dia} diaData={d} index={i} onChange={data => updateDia(i, data)} miembros={miembros} />)
          }
        </>
      )}

      <style>{`
        @media print {
          .sidebar, .page-header button, .btn { display: none !important; }
          .card { box-shadow: none !important; border: 1px solid #ccc !important; }
          body { background: white !important; color: black !important; }
        }
      `}</style>
      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast(null)} />}

    </div>
  )
}

