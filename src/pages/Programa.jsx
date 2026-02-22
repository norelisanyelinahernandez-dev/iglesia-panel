import { useState, useEffect } from 'react'
import { getMiembros } from '../api/client'

const DIAS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']

const TIPOS = [
  'Culto de avivamiento',
  'Estudio bíblico',
  'Escuela de niños',
  'Visita a enfermos',
  'Célula',
  'Retiro congregacional',
  'Culto unido',
]

const PARTES_POR_TIPO = {
  'Culto de avivamiento': ['Oración de apertura','Dirección','Devocional','Alabanzas','Mensaje','Oración de cierre'],
  'Célula': ['Oración de apertura','Dirección','Devocional','Alabanzas','Mensaje','Oración de cierre'],
  'Estudio bíblico': ['Oración de apertura','Encargado del estudio'],
  'Escuela de niños': ['Encargado'],
  'Visita a enfermos': [],
  'Retiro congregacional': [],
  'Culto unido': [],
}

const VERSICULOS = [
  { texto: 'No dejando de congregarnos, como algunos tienen por costumbre, sino exhortándonos.', ref: 'Hebreos 10:25' },
  { texto: 'Porque donde están dos o tres congregados en mi nombre, allí estoy yo en medio de ellos.', ref: 'Mateo 18:20' },
  { texto: 'Yo me alegré con los que me decían: A la casa de Jehová iremos.', ref: 'Salmos 122:1' },
  { texto: 'Una cosa he demandado a Jehová, ésta buscaré; que esté yo en la casa de Jehová todos los días de mi vida.', ref: 'Salmos 27:4' },
  { texto: 'Y perseveraban en la doctrina de los apóstoles, en la comunión unos con otros, en el partimiento del pan y en las oraciones.', ref: 'Hechos 2:42' },
  { texto: 'Engrandezcan a Jehová conmigo, y exaltemos su nombre a una.', ref: 'Salmos 34:3' },
  { texto: 'Cantad a Jehová cántico nuevo; su alabanza sea en la congregación de los santos.', ref: 'Salmos 149:1' },
]

const STORAGE_KEY = 'programa_semanal'

const emptyDia = (dia) => ({ dia, tipo:'', hora:'', lugar:'', encargado:'', partes:{}, pastor_visita:'', congregacion_visita:'' })

const emptyParte = () => ({ tipo_asignado:'miembro', miembro_id:'', nombre_externo:'', pastor_externo:'', congregacion_externa:'' })

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
            <option value="externo">Miembro de otra congregación</option>
          </select>
        </div>
        {p.tipo_asignado === 'miembro' ? (
          <div className="form-group" style={{ minWidth:180, flex:2 }}>
            <label className="form-label">Miembro</label>
            <select value={p.miembro_id} onChange={e=>h('miembro_id',e.target.value)} className="form-input">
              <option value="">— Seleccionar —</option>
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
              <label className="form-label">Congregación</label>
              <input value={p.congregacion_externa} onChange={e=>h('congregacion_externa',e.target.value)} className="form-input" placeholder="Nombre congregación" />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function DiaCard({ diaData, onChange, miembros, index }) {
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
          {d.tipo ? <span style={{ color:'var(--text-muted)', fontSize:13 }}>{d.tipo} {d.hora ? `· ${d.hora}` : ''}</span> : <span style={{ color:'var(--text-muted)', fontSize:13 }}>Sin actividad</span>}
        </div>
        <span style={{ color:'var(--text-muted)', fontSize:18 }}>{expandido ? '▲' : '▼'}</span>
      </div>

      {expandido && (
        <div style={{ marginTop:16 }}>
          <div className="grid-2" style={{ gap:12, marginBottom:12 }}>
            <div className="form-group">
              <label className="form-label">Tipo de actividad</label>
              <select value={d.tipo} onChange={e=>h('tipo',e.target.value)} className="form-input">
                <option value="">— Sin actividad —</option>
                {TIPOS.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Hora</label>
              <input type="time" value={d.hora} onChange={e=>h('hora',e.target.value)} className="form-input" />
            </div>
            {!esRetiroOUnido && (
              <>
                <div className="form-group">
                  <label className="form-label">Lugar</label>
                  <input value={d.lugar} onChange={e=>h('lugar',e.target.value)} className="form-input" placeholder="Ej: Templo principal" />
                </div>
                {d.tipo && d.tipo !== 'Visita a enfermos' && partes.length === 0 && !esRetiroOUnido && (
                  <div className="form-group">
                    <label className="form-label">Encargado general</label>
                    <select value={d.encargado} onChange={e=>h('encargado',e.target.value)} className="form-input">
                      <option value="">— Seleccionar —</option>
                      {miembros.map(m=><option key={m.id} value={m.id}>{m.nombres} {m.apellidos}</option>)}
                    </select>
                  </div>
                )}
              </>
            )}
          </div>

          {esRetiroOUnido && (
            <div className="grid-2" style={{ gap:12, marginBottom:12 }}>
              <div className="form-group">
                <label className="form-label">Pastor</label>
                <input value={d.pastor_visita} onChange={e=>h('pastor_visita',e.target.value)} className="form-input" placeholder="Nombre del pastor" />
              </div>
              <div className="form-group">
                <label className="form-label">Lugar</label>
                <input value={d.lugar} onChange={e=>h('lugar',e.target.value)} className="form-input" placeholder="Lugar del evento" />
              </div>
            </div>
          )}

          {partes.length > 0 && (
            <div style={{ marginTop:8 }}>
              <div style={{ fontWeight:600, fontSize:13, marginBottom:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:1 }}>Partes del programa</div>
              {partes.map(parte => (
                <ParteRow
                  key={parte}
                  label={parte}
                  parte={d.partes[parte]}
                  miembros={miembros}
                  onChange={val => h('partes', { ...d.partes, [parte]: val })}
                />
              ))}
            </div>
          )}

          {d.tipo === 'Visita a enfermos' && (
            <div className="form-group">
              <label className="form-label">Encargado de la visita</label>
              <select value={d.encargado} onChange={e=>h('encargado',e.target.value)} className="form-input">
                <option value="">— Seleccionar —</option>
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
  const [semana, setSemana] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || DIAS.map(emptyDia) }
    catch { return DIAS.map(emptyDia) }
  })
  const [guardado, setGuardado] = useState(false)
  const versiculo = VERSICULOS[new Date().getDay() % VERSICULOS.length]

  useEffect(() => {
    getMiembros({ limit:200 }).then(r => setMiembros(r.data)).catch(()=>{})
  }, [])

  const updateDia = (index, data) => {
    const nueva = [...semana]
    nueva[index] = data
    setSemana(nueva)
  }

  const guardar = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(semana))
    setGuardado(true)
    setTimeout(() => setGuardado(false), 3000)
  }

  const limpiar = () => {
    if (!confirm('¿Deseas limpiar el programa de esta semana?')) return
    const nuevo = DIAS.map(emptyDia)
    setSemana(nuevo)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevo))
  }

  const getNombre = (id) => {
    const m = miembros.find(m=>m.id===id)
    return m ? `${m.nombres} ${m.apellidos}` : id
  }

  const imprimir = () => window.print()

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Programa Semanal</h1>
          <p className="page-subtitle">Ministerio San Juan 7:38 — Del Semillero 1/11</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn btn-ghost" onClick={limpiar}>🗑 Limpiar</button>
          <button className="btn btn-ghost" onClick={imprimir}>🖨 Imprimir</button>
          <button className="btn btn-gold" onClick={guardar}>💾 Guardar</button>
        </div>
      </div>

      {guardado && <div className="alert alert-success" style={{ marginBottom:16 }}>✅ Programa guardado correctamente</div>}

      <div className="card" style={{ marginBottom:20, borderLeft:'3px solid var(--gold)', background:'var(--bg-card)' }}>
        <p style={{ fontStyle:'italic', fontSize:14, marginBottom:4 }}>"{versiculo.texto}"</p>
        <span style={{ color:'var(--gold)', fontSize:12, fontWeight:600 }}>— {versiculo.ref}</span>
      </div>

      {semana.map((d, i) => (
        <DiaCard key={d.dia} diaData={d} index={i} onChange={data => updateDia(i, data)} miembros={miembros} />
      ))}

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
