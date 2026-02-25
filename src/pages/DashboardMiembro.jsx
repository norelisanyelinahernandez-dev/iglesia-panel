import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getEventos, getAnuncios } from '../api/client'
import api from '../api/client'

const VERSICULOS = [
  { texto: '“Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz y no de mal.”', ref: 'Jeremías 29:11' },
  { texto: '“Todo lo puedo en Cristo que me fortalece.”', ref: 'Filipenses 4:13' },
  { texto: '“El Señor es mi pastor; nada me faltará.”', ref: 'Salmos 23:1' },
  { texto: '“Fíaos de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia.”', ref: 'Proverbios 3:5' },
  { texto: '“Mas buscad primeramente el reino de Dios y su justicia, y todas estas cosas os serán añadidas.”', ref: 'Mateo 6:33' },
  { texto: '“El que cree en mí, de su interior correrán ríos de agua viva.”', ref: 'Juan 7:38' },
  { texto: '“No se turbe vuestro corazón; creéis en Dios, creed también en mí.”', ref: 'Juan 14:1' },
  { texto: '“Encomienda a Jehová tu camino, y confía en él; y él hará.”', ref: 'Salmos 37:5' },
  { texto: '“Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien.”', ref: 'Romanos 8:28' },
  { texto: '“Jehová es mi luz y mi salvación; ¿de quién temeré?”', ref: 'Salmos 27:1' },
  { texto: '“Esforzaos y cobrad ánimo; no temáis, ni tengáis miedo, porque Jehová tu Dios va contigo.”', ref: 'Deuteronomio 31:6' },
  { texto: '“Los que esperan en Jehová tendrán nuevas fuerzas; levantarán alas como las águilas.”', ref: 'Isaías 40:31' },
  { texto: '“Venid a mí todos los que estáis trabajados y cargados, y yo os haré descansar.”', ref: 'Mateo 11:28' },
  { texto: '“El amor es sufrido, es benigno; el amor no tiene envidia.”', ref: '1 Corintios 13:4' },
  { texto: '“Estad siempre gozosos. Orad sin cesar. Dad gracias en todo.”', ref: '1 Tesalonicenses 5:16-18' },
  { texto: '“De tal manera amó Dios al mundo, que ha dado a su Hijo unigénito.”', ref: 'Juan 3:16' },
  { texto: '“Jehová peleará por vosotros, y vosotros estaréis tranquilos.”', ref: 'Éxodo 14:14' },
  { texto: '“El nombre de Jehová es torre fuerte; a él correrá el justo y será levantado.”', ref: 'Proverbios 18:10' },
  { texto: '“Bendito el varón que confía en Jehová, y cuya confianza es Jehová.”', ref: 'Jeremías 17:7' },
  { texto: '“Ninguna arma forjada contra ti prosperará.”', ref: 'Isaías 54:17' },
  { texto: '“Jehová tu Dios está en medio de ti, poderoso, él salvará.”', ref: 'Sofonías 3:17' },
  { texto: '“Pelea la buena batalla de la fe, echa mano de la vida eterna.”', ref: '1 Timoteo 6:12' },
  { texto: '“Dios es nuestro amparo y fortaleza, nuestro pronto auxilio en las tribulaciones.”', ref: 'Salmos 46:1' },
  { texto: '“Bástate mi gracia; porque mi poder se perfecciona en la debilidad.”', ref: '2 Corintios 12:9' },
  { texto: '“Alzaré mis ojos a los montes; ¿de dónde vendrá mi socorro? Mi socorro viene de Jehová.”', ref: 'Salmos 121:1-2' },
  { texto: '“Yo soy la vid, vosotros los pámpanos; el que permanece en mí, éste lleva mucho fruto.”', ref: 'Juan 15:5' },
  { texto: '“Clama a mí, y yo te responderé, y te enseñaré cosas grandes y ocultas.”', ref: 'Jeremías 33:3' },
  { texto: '“No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios.”', ref: 'Isaías 41:10' },
  { texto: '“El corazón del hombre piensa su camino; mas Jehová endereza sus pasos.”', ref: 'Proverbios 16:9' },
  { texto: '“Sean gratas las palabras de mi boca y la meditación de mi corazón delante de ti.”', ref: 'Salmos 19:14' },
  { texto: '“El que habita al abrigo del Altísimo morará bajo la sombra del Omnipotente.”', ref: 'Salmos 91:1' },
]

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function DashboardMiembro() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [cumpleanos, setCumpleanos] = useState([])
  const [eventos, setEventos] = useState([])
  const [anuncios, setAnuncios] = useState([])
  const [loading, setLoading] = useState(true)

  const hoy = new Date()
  const mesActual = hoy.getMonth() + 1
  const diaDelAnio = Math.floor((hoy - new Date(hoy.getFullYear(), 0, 0)) / 86400000)
  const versiculo = VERSICULOS[diaDelAnio % VERSICULOS.length]

  useEffect(() => {
    const load = async () => {
      try {
        const [miembrosRes, eventosRes, anunciosRes] = await Promise.allSettled([
          api.get('/miembros/', { params: { limit: 500 } }),
          getEventos(),
          getAnuncios(),
        ])
        if (miembrosRes.status === 'fulfilled') {
          const cumples = (miembrosRes.value.data || [])
            .filter(m => m.fecha_nacimiento && parseInt(m.fecha_nacimiento.split('-')[1]) === mesActual)
            .sort((a, b) => parseInt(a.fecha_nacimiento.split('-')[2]) - parseInt(b.fecha_nacimiento.split('-')[2]))
          setCumpleanos(cumples)
        }
        if (eventosRes.status === 'fulfilled') {
          const proximos = (eventosRes.value.data || [])
            .filter(ev => new Date(ev.fecha_inicio || ev.fecha) >= hoy)
            .slice(0, 3)
          setEventos(proximos)
        }
        if (anunciosRes.status === 'fulfilled') {
          setAnuncios((anunciosRes.value.data || []).slice(0, 3))
        }
      } catch (_) {}
      setLoading(false)
    }
    load()
  }, [])

  const SectionHeader = ({ emoji, title, link }) => (
    <div style={{ borderLeft:'3px solid var(--gold)', paddingLeft:12, marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <div style={{ fontWeight:700, fontSize:13, color:'var(--gold)', textTransform:'uppercase', letterSpacing:1 }}>{emoji} {title}</div>
      {link && <button onClick={() => navigate(link)} style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:12, cursor:'pointer', textDecoration:'underline' }}>Ver todos →</button>}
    </div>
  )

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">¡Bienvenido, {user?.nombre?.split(' ')[0]}!</h1>
          <p className="page-subtitle">Ministerio San Juan 7:38 · Del Semillero 1/11</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom:20, borderLeft:'4px solid var(--gold)', background:'linear-gradient(135deg, var(--surface-2), var(--surface))' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
          <span style={{ fontSize:32, flexShrink:0 }}>✝️</span>
          <div>
            <div style={{ fontSize:11, color:'var(--gold)', fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Versículo del día</div>
            <p style={{ fontStyle:'italic', fontSize:15, lineHeight:1.8, color:'var(--text)', marginBottom:8 }}>{versiculo.texto}</p>
            <span style={{ color:'var(--gold)', fontWeight:700, fontSize:13 }}>— {versiculo.ref}</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom:20 }}>
        <SectionHeader emoji="&#128197;" title="Próximos Eventos" link="/miembro/eventos" />
        {loading ? <div style={{ textAlign:'center', padding:20 }}><span className="spinner" /></div>
        : eventos.length === 0 ? <p style={{ color:'var(--text-muted)', fontSize:13, textAlign:'center', padding:'10px 0' }}>No hay eventos próximos.</p>
        : <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {eventos.map(ev => {
              const fecha = new Date(ev.fecha_inicio || ev.fecha)
              return (
                <div key={ev.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 10px', borderRadius:10, background:'var(--surface-2)', border:'1px solid var(--border)' }}>
                  <div style={{ background:'var(--gold)', color:'#000', borderRadius:8, padding:'6px 10px', textAlign:'center', minWidth:44, flexShrink:0 }}>
                    <div style={{ fontSize:16, fontWeight:700 }}>{fecha.getDate()}</div>
                    <div style={{ fontSize:10, fontWeight:600 }}>{MESES[fecha.getMonth()].slice(0,3).toUpperCase()}</div>
                  </div>
                  <div>
                    <div style={{ fontWeight:600, fontSize:14 }}>{ev.nombre || ev.titulo}</div>
                    {ev.lugar && <div style={{ fontSize:12, color:'var(--text-muted)' }}>&#128205; {ev.lugar}</div>}
                  </div>
                </div>
              )
            })}
          </div>}
      </div>

      <div className="card" style={{ marginBottom:20 }}>
        <SectionHeader emoji="&#128226;" title="Anuncios" link="/miembro/anuncios" />
        {loading ? <div style={{ textAlign:'center', padding:20 }}><span className="spinner" /></div>
        : anuncios.length === 0 ? <p style={{ color:'var(--text-muted)', fontSize:13, textAlign:'center', padding:'10px 0' }}>No hay anuncios por el momento.</p>
        : <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {anuncios.map((a, i) => (
              <div key={i} style={{ padding:'10px 12px', borderRadius:10, background:'var(--surface-2)', borderLeft:'3px solid var(--gold)' }}>
                <div style={{ fontWeight:600, fontSize:14, marginBottom:4 }}>{a.titulo}</div>
                <div style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.5, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{a.contenido}</div>
              </div>
            ))}
          </div>}
      </div>

      <div className="card">
        <SectionHeader emoji="&#127874;" title={"Cumpleaños de " + MESES[mesActual - 1]} />
        <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:12 }}>{loading ? '...' : `${cumpleanos.length} miembro${cumpleanos.length !== 1 ? 's' : ''} este mes`}</div>
        {loading ? <div style={{ textAlign:'center', padding:30 }}><span className="spinner" /></div>
        : cumpleanos.length === 0 ? <p style={{ color:'var(--text-muted)', fontSize:14, textAlign:'center', padding:'20px 0' }}>No hay cumpleaños registrados este mes.</p>
        : <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {cumpleanos.map(m => {
              const dia = parseInt(m.fecha_nacimiento.split('-')[2])
              const esHoy = dia === hoy.getDate()
              return (
                <div key={m.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'10px 12px', borderRadius:10, background: esHoy ? 'var(--gold)' : 'var(--surface-2)', border: esHoy ? 'none' : '1px solid var(--border)' }}>
                  <div style={{ width:44, height:44, borderRadius:10, flexShrink:0, background: esHoy ? '#000' : 'var(--surface)', display:'flex', alignItems:'center', justifyContent:'center', fontSize: esHoy ? 22 : 18 }}>
                    {esHoy ? '&#127881;' : '&#127874;'}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:14, color: esHoy ? '#000' : 'var(--text)' }}>
                      {m.nombres} {m.apellidos}
                      {esHoy && <span style={{ marginLeft:8, fontSize:11, background:'#000', color:'var(--gold)', borderRadius:4, padding:'2px 6px' }}>¡HOY! &#127882;</span>}
                    </div>
                    <div style={{ fontSize:12, color: esHoy ? '#333' : 'var(--text-muted)' }}>{dia} de {MESES[mesActual - 1]} · {m.rol || 'Miembro'}</div>
                  </div>
                </div>
              )
            })}
          </div>}
      </div>
    </div>
  )
}
