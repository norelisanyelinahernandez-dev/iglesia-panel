import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { usePermisos } from '../context/PermisosContext'
import { getMiembros, getIngresos, getGastos, getEventos } from '../api/client'

const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY

export default function Asistente() {
  const { user } = useAuth()
  const { permisos } = usePermisos()
  const [mensajes, setMensajes] = useState([
    { rol: 'ia', texto: `Hola ${user?.nombre?.split(' ')[0]} 👋 Soy tu asistente del Ministerio San Juan 7:38. Puedo ayudarte con informacion sobre el sistema segun tu rol. ¿En que te puedo ayudar?` }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [datos, setDatos] = useState({})
  const bottomRef = useRef(null)

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const resultados = {}
        if (permisos.includes('miembros')) {
          const m = await getMiembros({ limit: 500 })
          resultados.miembros = m.data
        }
        if (permisos.includes('tesoreria')) {
          const [i, g] = await Promise.allSettled([
            getIngresos({ limit: 500 }),
            getGastos({ limit: 500 }),
          ])
          if (i.status === 'fulfilled') resultados.ingresos = i.value.data
          if (g.status === 'fulfilled') resultados.gastos = g.value.data
        }
        if (permisos.includes('eventos')) {
          const e = await getEventos()
          resultados.eventos = e.data
        }
        const asistencia = localStorage.getItem('asistencia_iglesia')
        if (asistencia) resultados.asistencia = JSON.parse(asistencia)
        const programa = localStorage.getItem('programas_semanales')
        if (programa) resultados.programa = JSON.parse(programa)
        setDatos(resultados)
      } catch(_) {}
    }
    cargarDatos()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  const construirContexto = () => {
    let ctx = `Eres un asistente inteligente del Ministerio San Juan 7:38 - Del Semillero 1/11. 
El usuario es ${user?.nombre}, con rol: ${user?.rol}.
Solo puedes responder sobre las secciones a las que tiene acceso: ${permisos.join(', ')}.
Responde siempre en español, de forma clara y concisa.
Si te preguntan algo fuera de tu acceso, explica amablemente que no tienes permiso para ver esa informacion.
Aqui estan los datos actuales del sistema:\n\n`

    if (datos.miembros) {
      const activos = datos.miembros.filter(m => m.estado === 'activo').length
      const inactivos = datos.miembros.filter(m => m.estado === 'inactivo').length
      ctx += `MIEMBROS: Total ${datos.miembros.length}, Activos: ${activos}, Inactivos: ${inactivos}\n`
      ctx += `Lista: ${datos.miembros.map(m => `${m.nombres} ${m.apellidos} (${m.estado}, ${m.rol})`).join(', ')}\n\n`
    }
    if (datos.ingresos) {
      const totalIng = datos.ingresos.reduce((a,b) => a + parseFloat(b.monto), 0)
      ctx += `INGRESOS: Total ${datos.ingresos.length} registros, Monto total: RD$${totalIng.toLocaleString()}\n\n`
    }
    if (datos.gastos) {
      const totalGas = datos.gastos.reduce((a,b) => a + parseFloat(b.monto), 0)
      ctx += `GASTOS: Total ${datos.gastos.length} registros, Monto total: RD$${totalGas.toLocaleString()}\n\n`
    }
    if (datos.eventos) {
      ctx += `EVENTOS: ${datos.eventos.length} eventos registrados\n`
      ctx += `Lista: ${datos.eventos.map(e => e.nombre).join(', ')}\n\n`
    }
    if (datos.asistencia) {
      ctx += `ASISTENCIA: ${datos.asistencia.length} registros de asistencia\n\n`
    }
    if (datos.programa) {
      ctx += `PROGRAMA: Hay programas semanales guardados en el sistema\n\n`
    }
    return ctx
  }

  const enviar = async () => {
    if (!input.trim() || loading) return
    const pregunta = input.trim()
    setInput('')
    setMensajes(prev => [...prev, { rol: 'user', texto: pregunta }])
    setLoading(true)

    try {
      const contexto = construirContexto()
      const historial = mensajes.slice(-6).map(m => ({
        role: m.rol === 'user' ? 'user' : 'model',
        parts: [{ text: m.texto }]
      }))

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: contexto }] },
          contents: [...historial, { role: 'user', parts: [{ text: pregunta }] }]
        })
      })
      const data = await res.json()
      const respuesta = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No pude procesar tu pregunta. Intenta de nuevo.'
      setMensajes(prev => [...prev, { rol: 'ia', texto: respuesta }])
    } catch(_) {
      setMensajes(prev => [...prev, { rol: 'ia', texto: 'Hubo un error al conectar con la IA. Verifica tu conexion.' }])
    }
    setLoading(false)
  }

  const SUGERENCIAS = permisos.includes('ver_balance')
    ? ['Resumen de tesoreria', 'Miembros inactivos', 'Cuantos miembros tenemos', 'Balance del mes']
    : permisos.includes('miembros')
    ? ['Cuantos miembros tenemos', 'Proximos eventos', 'Resumen de asistencia']
    : ['Programa de esta semana', 'Proximos eventos']

  return (
    <div className="page" style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 64px)' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Asistente IA</h1>
          <p className="page-subtitle">Preguntame sobre el sistema</p>
        </div>
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        {SUGERENCIAS.map(s => (
          <button key={s} onClick={() => { setInput(s); }}
            style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:20, padding:'6px 14px', fontSize:12, cursor:'pointer', color:'var(--text-muted)' }}>
            {s}
          </button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:12, marginBottom:16, padding:'4px 2px' }}>
        {mensajes.map((m, i) => (
          <div key={i} style={{ display:'flex', justifyContent: m.rol === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth:'80%', padding:'12px 16px', borderRadius: m.rol === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: m.rol === 'user' ? 'var(--gold)' : 'var(--bg-card)',
              color: m.rol === 'user' ? '#000' : 'var(--text)',
              fontSize:14, lineHeight:1.6, whiteSpace:'pre-wrap'
            }}>
              {m.rol === 'ia' && <div style={{ fontSize:11, color:'var(--gold)', fontWeight:700, marginBottom:4 }}>✦ Asistente</div>}
              {m.texto}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display:'flex', justifyContent:'flex-start' }}>
            <div style={{ background:'var(--bg-card)', borderRadius:'18px 18px 18px 4px', padding:'12px 16px' }}>
              <span className="spinner" style={{ width:16, height:16 }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ display:'flex', gap:10, alignItems:'center' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && enviar()}
          placeholder="Escribe tu pregunta..."
          className="form-input"
          style={{ flex:1 }}
        />
        <button onClick={enviar} disabled={loading || !input.trim()} className="btn btn-gold" style={{ padding:'10px 20px' }}>
          Enviar
        </button>
      </div>
    </div>
  )
}
