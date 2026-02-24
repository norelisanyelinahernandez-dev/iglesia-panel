import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getMiembros, getEventos } from '../api/client'

const fmtDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('es-DO', { day:'2-digit', month:'long', year:'numeric' }) : null
const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : ''

export default function MiPerfilMiembro() {
  const { user, logout } = useAuth()
  const [miembro, setMiembro] = useState(null)
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [m, e] = await Promise.allSettled([
          getMiembros({ limit: 500 }),
          getEventos()
        ])
        if (m.status === 'fulfilled') {
          const encontrado = m.value.data.find(x => x.id === user?.id)
          setMiembro(encontrado || null)
        }
        if (e.status === 'fulfilled') {
          const hoy = new Date()
          const proximos = e.value.data.filter(ev => new Date(ev.fecha) >= hoy).slice(0, 5)
          setEventos(proximos)
        }
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

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}><span className="spinner" style={{width:36,height:36}} /></div>

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', padding:'0 0 40px' }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg, var(--surface-2), var(--surface-3))', padding:'24px 20px 20px', position:'relative' }}>
        <button onClick={logout} style={{ position:'absolute', top:16, right:16, background:'none', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-muted)', fontSize:12, padding:'6px 12px', cursor:'pointer' }}>
          Salir
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          {miembro?.foto ? (
            <img src={miembro.foto} style={{ width:72, height:72, borderRadius:'50%', objectFit:'cover', border:'3px solid var(--gold)' }} />
          ) : (
            <div style={{ width:72, height:72, borderRadius:'50%', background:'var(--surface)', border:'3px solid var(--gold)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:30 }}>🙏</div>
          )}
          <div>
            <div style={{ fontSize:11, color:'var(--gold)', fontWeight:600, textTransform:'uppercase', letterSpacing:1 }}>Ministerio San Juan 7:38</div>
            <div style={{ fontSize:20, fontWeight:700, color:'var(--text)' }}>{user?.nombre}</div>
            <div style={{ fontSize:13, color:'var(--text-muted)' }}>{cap(miembro?.rol)} · {cap(miembro?.estado)}</div>
          </div>
        </div>
      </div>

      <div style={{ padding:'16px 16px 0' }}>
        {/* Mi información */}
        {miembro && (
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden', marginBottom:16 }}>
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
            </div>
          </div>
        )}

        {/* Próximos eventos */}
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
                  <div style={{ fontSize:10, fontWeight:600 }}>{new Date(ev.fecha).toLocaleDateString('es-DO', { month:'short' }).toUpperCase()}</div>
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

        <div style={{ textAlign:'center', marginTop:24 }}>
          <p style={{ fontStyle:'italic', fontSize:12, color:'var(--text-muted)' }}>"de su interior correrán ríos de agua viva." — Juan 7:38</p>
        </div>
      </div>
    </div>
  )
}
