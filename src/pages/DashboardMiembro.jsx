import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

const VERSICULOS = [
  { texto: '"Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz y no de mal."', ref: 'Jeremías 29:11' },
  { texto: '"Todo lo puedo en Cristo que me fortalece."', ref: 'Filipenses 4:13' },
  { texto: '"El Señor es mi pastor; nada me faltará."', ref: 'Salmos 23:1' },
  { texto: '"Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia."', ref: 'Proverbios 3:5' },
  { texto: '"Mas buscad primeramente el reino de Dios y su justicia, y todas estas cosas os serán añadidas."', ref: 'Mateo 6:33' },
  { texto: '"El que cree en mí, como dice la Escritura, de su interior correrán ríos de agua viva."', ref: 'Juan 7:38' },
  { texto: '"No se turbe vuestro corazón; creéis en Dios, creed también en mí."', ref: 'Juan 14:1' },
  { texto: '"Encomienda a Jehová tu camino, y confía en él; y él hará."', ref: 'Salmos 37:5' },
  { texto: '"Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien."', ref: 'Romanos 8:28' },
  { texto: '"Jehová es mi luz y mi salvación; ¿de quién temeré?"', ref: 'Salmos 27:1' },
  { texto: '"Esforzaos y cobrad ánimo; no temáis, ni tengáis miedo, porque Jehová tu Dios es el que va contigo."', ref: 'Deuteronomio 31:6' },
  { texto: '"Pero los que esperan en Jehová tendrán nuevas fuerzas; levantarán alas como las águilas."', ref: 'Isaías 40:31' },
]

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function DashboardMiembro() {
  const { user } = useAuth()
  const [cumpleanos, setCumpleanos] = useState([])
  const [loading, setLoading] = useState(true)

  const hoy = new Date()
  const mesActual = hoy.getMonth() + 1
  const diaDelAnio = Math.floor((hoy - new Date(hoy.getFullYear(), 0, 0)) / 86400000)
  const versiculo = VERSICULOS[diaDelAnio % VERSICULOS.length]

  useEffect(() => {
    api.get('/miembros/', { params: { limit: 500 } })
      .then(r => {
        const hoyMes = mesActual
        const cumples = (r.data || [])
          .filter(m => {
            if (!m.fecha_nacimiento) return false
            const mes = parseInt(m.fecha_nacimiento.split('-')[1])
            return mes === hoyMes
          })
          .sort((a, b) => {
            const diaA = parseInt(a.fecha_nacimiento.split('-')[2])
            const diaB = parseInt(b.fecha_nacimiento.split('-')[2])
            return diaA - diaB
          })
        setCumpleanos(cumples)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">¡Bienvenido, {user?.nombre?.split(' ')[0]}!</h1>
          <p className="page-subtitle">Ministerio San Juan 7:38 · Del Semillero 1/11</p>
        </div>
      </div>

      {/* Versículo del día */}
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

      {/* Cumpleaños del mes */}
      <div className="card">
        <div style={{ borderLeft:'3px solid var(--gold)', paddingLeft:12, marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontWeight:700, fontSize:13, color:'var(--gold)', textTransform:'uppercase', letterSpacing:1 }}>🎂 Cumpleaños de {MESES[mesActual - 1]}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{loading ? '...' : `${cumpleanos.length} miembro${cumpleanos.length !== 1 ? 's' : ''} este mes`}</div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:30 }}><span className="spinner" /></div>
        ) : cumpleanos.length === 0 ? (
          <p style={{ color:'var(--text-muted)', fontSize:14, textAlign:'center', padding:'20px 0' }}>No hay cumpleaños registrados este mes.</p>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {cumpleanos.map(m => {
              const dia = parseInt(m.fecha_nacimiento.split('-')[2])
              const esHoy = dia === hoy.getDate()
              return (
                <div key={m.id} style={{
                  display:'flex', alignItems:'center', gap:14, padding:'10px 12px',
                  borderRadius:10, background: esHoy ? 'var(--gold)' : 'var(--surface-2)',
                  border: esHoy ? 'none' : '1px solid var(--border)'
                }}>
                  <div style={{
                    width:44, height:44, borderRadius:10, flexShrink:0,
                    background: esHoy ? '#000' : 'var(--surface)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize: esHoy ? 22 : 18
                  }}>
                    {esHoy ? '🎉' : '🎂'}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:14, color: esHoy ? '#000' : 'var(--text)' }}>
                      {m.nombres} {m.apellidos}
                      {esHoy && <span style={{ marginLeft:8, fontSize:11, background:'#000', color:'var(--gold)', borderRadius:4, padding:'2px 6px' }}>¡HOY! 🎊</span>}
                    </div>
                    <div style={{ fontSize:12, color: esHoy ? '#333' : 'var(--text-muted)' }}>
                      {dia} de {MESES[mesActual - 1]} · {m.rol || 'Miembro'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
