import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getMiembroById, getEventos, getAnuncios, getPastora, getPrograma } from '../api/client'

const fmtDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('es-DO', { day:'2-digit', month:'long', year:'numeric' }) : null
const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : ''
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const ROLES_AVANZADOS = ['diacono','lider','maestra','maestro','secretaria','secretario','copastor','copastora','pastor','pastora']

export default function MiPerfilMiembro() {
  const { user, logout } = useAuth()
  const [miembro, setMiembro] = useState(null)
  const [eventos, setEventos] = useState([])
  const [totalMiembros, setTotalMiembros] = useState(null)
  const [loading, setLoading] = useState(true)
  const [seccion, setSeccion] = useState('perfil')

  const esRolAvanzado = ROLES_AVANZADOS.includes(user?.rol?.toLowerCase())

  const [anuncios, setAnuncios] = useState([])
  const [pastora, setPastora] = useState(null)
  const [programaSemana, setProgramaSemana] = useState(null)

  const getSemana = () => {
    const d = new Date()
    d.setDate(d.getDate() + 4 - (d.getDay() || 7))
    const yearStart = new Date(d.getFullYear(), 0, 1)
    return `${d.getFullYear()}-W${Math.ceil((((d - yearStart) / 86400000) + 1) / 7).toString().padStart(2, '0')}`
  }

  useEffect(() => {
    const load = async () => {
      try {
        const [m, e] = await Promise.allSettled([
          getMiembroById(user?.id),
          getEventos()
        ])
        if (m.status === 'fulfilled') {
          setMiembro(m.value.data || null)
        }
        if (esRolAvanzado) {
          // Intentar obtener total de miembros activos
          try {
            const { getMiembros } = await import('../api/client')
            const todos = await getMiembros({ limit: 500 })
            setTotalMiembros(todos.data.filter(x => x.estado === 'activo').length)
          } catch (_) {}
        }
        if (e.status === 'fulfilled') {
          const hoy = new Date()
          setEventos(e.value.data.filter(ev => new Date(ev.fecha) >= hoy).slice(0, 5))
        }
        // Cargar contenido público
        try { const ra = await getAnuncios(); setAnuncios(ra.data || []) } catch (_) {}
        try { const rp = await getPastora(); setPastora(rp.data || null) } catch (_) {}
        try { const rpr = await getPrograma(getSemana()); setProgramaSemana(rpr.data?.datos || null) } catch (_) {}
      } catch (_) {}
      setLoading(false)
    }
    load()
  }, [])

  const InfoRow = ({ icon, label, value }) => value ? (
    <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
      <span style={{ fontSize:15, minWidth:20, textAlign:'center' }}>{icon}</span>
      <div>
        <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:2 }}>{label}</div>
        <div style={{ fontSize:13, fontWeight:500 }}>{value}</div>
      </div>
    </div>
  ) : null

  const NavBtn = ({ id, icon, label }) => (
    <button onClick={() => setSeccion(id)} style={{
      flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'10px 4px',
      background:'none', border:'none', cursor:'pointer',
      color: seccion === id ? 'var(--gold)' : 'var(--text-muted)',
      borderTop: seccion === id ? '2px solid var(--gold)' : '2px solid transparent',
      fontSize:11, fontWeight: seccion === id ? 700 : 400
    }}>
      <span style={{ fontSize:20 }}>{icon}</span>
      {label}
    </button>
  )

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}><span className="spinner" style={{width:36,height:36}} /></div>

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', paddingBottom:70 }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg, var(--surface-2), var(--surface-3))', padding:'20px 16px 16px', position:'relative' }}>
        <button onClick={logout} style={{ position:'absolute', top:14, right:14, background:'none', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-muted)', fontSize:12, padding:'5px 10px', cursor:'pointer' }}>
          Salir
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          {miembro?.foto ? (
            <img src={miembro.foto} style={{ width:64, height:64, borderRadius:'50%', objectFit:'cover', border:'3px solid var(--gold)' }} />
          ) : (
            <div style={{ width:64, height:64, borderRadius:'50%', background:'var(--surface)', border:'3px solid var(--gold)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>🙏</div>
          )}
          <div>
            <div style={{ fontSize:11, color:'var(--gold)', fontWeight:600, textTransform:'uppercase', letterSpacing:1 }}>Ministerio San Juan 7:38</div>
            <div style={{ fontSize:18, fontWeight:700 }}>{user?.nombre}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>{cap(miembro?.rol)} · {cap(miembro?.estado)}</div>
          </div>
        </div>

        {/* Stat de miembros activos solo para roles avanzados */}
        {esRolAvanzado && totalMiembros !== null && (
          <div style={{ marginTop:14, background:'var(--surface)', borderRadius:10, padding:'10px 16px', display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:22 }}>✦</span>
            <div>
              <div style={{ fontSize:20, fontWeight:700, color:'var(--gold)' }}>{totalMiembros}</div>
              <div style={{ fontSize:11, color:'var(--text-muted)' }}>Miembros activos</div>
            </div>
          </div>
        )}
      </div>

      {/* Contenido por sección */}
      <div style={{ padding:'16px 16px 0' }}>

        {/* PERFIL */}
        {seccion === 'perfil' && miembro && (
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
            <div style={{ padding:'10px 16px', background:'var(--surface-2)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8 }}>
              <span>👤</span>
              <span style={{ fontWeight:700, fontSize:12, color:'var(--gold)', textTransform:'uppercase', letterSpacing:1 }}>Mi Información</span>
            </div>
            <div style={{ padding:'4px 16px 8px' }}>
              <InfoRow icon="📱" label="Teléfono" value={miembro.telefono} />
              <InfoRow icon="✉️" label="Correo" value={miembro.email} />
              <InfoRow icon="🎂" label="Fecha de nacimiento" value={fmtDate(miembro.fecha_nacimiento)} />
              <InfoRow icon="💧" label="Fecha de bautismo" value={fmtDate(miembro.fecha_bautismo)} />
              <InfoRow icon="⭐" label="Ministerio" value={miembro.ministerio_actual} />
              <InfoRow icon="📍" label="Dirección" value={miembro.direccion} />
              <InfoRow icon="💼" label="Ocupación" value={miembro.ocupacion} />
            </div>
          </div>
        )}

        {/* EVENTOS */}
        {seccion === 'eventos' && (
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
            <div style={{ padding:'10px 16px', background:'var(--surface-2)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8 }}>
              <span>📅</span>
              <span style={{ fontWeight:700, fontSize:12, color:'var(--gold)', textTransform:'uppercase', letterSpacing:1 }}>Próximos Eventos</span>
            </div>
            <div style={{ padding:'8px 16px' }}>
              {eventos.length === 0 ? (
                <p style={{ color:'var(--text-muted)', fontSize:13, padding:'8px 0' }}>No hay eventos próximos.</p>
              ) : eventos.map(ev => (
                <div key={ev.id} style={{ padding:'10px 0', borderBottom:'1px solid var(--border)', display:'flex', gap:12, alignItems:'flex-start' }}>
                  <div style={{ background:'var(--gold)', color:'#000', borderRadius:8, padding:'6px 10px', textAlign:'center', minWidth:44 }}>
                    <div style={{ fontSize:16, fontWeight:700 }}>{new Date(ev.fecha).getDate()}</div>
                    <div style={{ fontSize:10, fontWeight:600 }}>{MESES[new Date(ev.fecha).getMonth()].slice(0,3).toUpperCase()}</div>
                  </div>
                  <div>
                    <div style={{ fontWeight:600, fontSize:14 }}>{ev.nombre || ev.titulo}</div>
                    {ev.lugar && <div style={{ fontSize:12, color:'var(--text-muted)' }}>📍 {ev.lugar}</div>}
                    {ev.hora && <div style={{ fontSize:12, color:'var(--text-muted)' }}>🕐 {ev.hora}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PROGRAMA */}
        {seccion === 'programa' && (
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
            <div style={{ padding:'10px 16px', background:'var(--surface-2)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8 }}>
              <span>📋</span>
              <span style={{ fontWeight:700, fontSize:12, color:'var(--gold)', textTransform:'uppercase', letterSpacing:1 }}>Programa de esta semana</span>
            </div>
            <div style={{ padding:'12px 16px' }}>
              {!programaSemana ? (
                <p style={{ color:'var(--text-muted)', fontSize:13 }}>No hay programa registrado para esta semana.</p>
              ) : programaSemana.dias?.map((d, i) => (
                <div key={i} style={{ marginBottom:16, padding:12, background:'var(--surface-2)', borderRadius:10 }}>
                  <div style={{ fontWeight:700, color:'var(--gold)', marginBottom:8, fontSize:14 }}>{d.tipo} — {d.hora} {d.lugar ? `· ${d.lugar}` : ''}</div>
                  {d.partes && Object.entries(d.partes).map(([parte, val]) => (
                    <div key={parte} style={{ fontSize:13, padding:'4px 0', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between' }}>
                      <span style={{ color:'var(--text-muted)' }}>{parte}</span>
                      <span style={{ fontWeight:500 }}>{val?.nombre_libre || val?.pastor_externo || '—'}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ANUNCIOS */}
        {seccion === 'anuncios' && (
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
            <div style={{ padding:'10px 16px', background:'var(--surface-2)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8 }}>
              <span>📢</span>
              <span style={{ fontWeight:700, fontSize:12, color:'var(--gold)', textTransform:'uppercase', letterSpacing:1 }}>Anuncios</span>
            </div>
            <div style={{ padding:'12px 16px' }}>
              {anuncios.length === 0 ? (
                <p style={{ color:'var(--text-muted)', fontSize:13 }}>No hay anuncios por el momento.</p>
              ) : anuncios.map((a, i) => (
                <div key={i} style={{ marginBottom:12, padding:12, background:'var(--surface-2)', borderRadius:10, borderLeft:'3px solid var(--gold)' }}>
                  <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{a.titulo}</div>
                  <div style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.6 }}>{a.contenido}</div>
                  {a.fecha && <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:6 }}>📅 {a.fecha}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PASTORA */}
        {seccion === 'pastora' && (
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
            <div style={{ padding:'10px 16px', background:'var(--surface-2)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8 }}>
              <span>✝️</span>
              <span style={{ fontWeight:700, fontSize:12, color:'var(--gold)', textTransform:'uppercase', letterSpacing:1 }}>Información Pastoral</span>
            </div>
            <div style={{ padding:'12px 16px' }}>
              {!pastora ? (
                <p style={{ color:'var(--text-muted)', fontSize:13 }}>No hay información pastoral disponible.</p>
              ) : (
                <>
                  {pastora.foto && <img src={pastora.foto} style={{ width:80, height:80, borderRadius:'50%', objectFit:'cover', border:'3px solid var(--gold)', display:'block', margin:'0 auto 12px' }} />}
                  <div style={{ textAlign:'center', marginBottom:16 }}>
                    <div style={{ fontSize:18, fontWeight:700 }}>{pastora.nombre}</div>
                    {pastora.cargo && <div style={{ fontSize:13, color:'var(--gold)' }}>{pastora.cargo}</div>}
                  </div>
                  {pastora.biografia && <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.7, marginBottom:12 }}>{pastora.biografia}</p>}
                  {pastora.versiculo && (
                    <div style={{ background:'var(--surface-2)', borderRadius:10, padding:12, borderLeft:'3px solid var(--gold)' }}>
                      <p style={{ fontStyle:'italic', fontSize:13, color:'var(--text-muted)', margin:0 }}>"{pastora.versiculo}"</p>
                      {pastora.referencia && <span style={{ fontSize:11, color:'var(--gold)', fontWeight:600 }}>— {pastora.referencia}</span>}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Barra de navegación inferior */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'var(--surface)', borderTop:'1px solid var(--border)', display:'flex' }}>
        <NavBtn id="perfil" icon="👤" label="Mi Perfil" />
        <NavBtn id="eventos" icon="📅" label="Eventos" />
        <NavBtn id="programa" icon="📋" label="Programa" />
        <NavBtn id="anuncios" icon="📢" label="Anuncios" />
        <NavBtn id="pastora" icon="✝️" label="Pastoral" />
      </div>
    </div>
  )
}
