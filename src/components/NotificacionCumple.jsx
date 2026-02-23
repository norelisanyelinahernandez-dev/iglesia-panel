import { useEffect, useState } from 'react'
import { getMiembros } from '../api/client'

export default function NotificacionCumple() {
  const [cumpleaneros, setCumpleaneros] = useState([])
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const verificar = async () => {
      try {
        const { data } = await getMiembros({ limit: 500 })
        const hoy = new Date()
        const dia = hoy.getDate()
        const mes = hoy.getMonth() + 1
        const hoy_cumple = data.filter(m => {
          if (!m.fecha_nacimiento) return false
          const fecha = new Date(m.fecha_nacimiento)
          return fecha.getDate() === dia && (fecha.getMonth() + 1) === mes
        })
        if (hoy_cumple.length > 0) {
          setCumpleaneros(hoy_cumple)
          setVisible(true)
        }
      } catch(_) {}
    }
    verificar()
  }, [])

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24,
      background: 'var(--surface)',
      border: '1px solid var(--gold)',
      borderRadius: 16,
      padding: '18px 20px',
      maxWidth: 320,
      zIndex: 999,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      animation: 'slideIn 0.4s ease'
    }}>
      <style>{`@keyframes slideIn { from { transform: translateY(20px); opacity:0 } to { transform: translateY(0); opacity:1 } }`}</style>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:24 }}>🎂</span>
          <div>
            <div style={{ fontWeight:700, fontSize:14, color:'var(--gold)' }}>Cumpleanos hoy!</div>
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>
              {cumpleaneros.length === 1 ? '1 miembro cumple anos' : `${cumpleaneros.length} miembros cumplen anos`}
            </div>
          </div>
        </div>
        <button onClick={() => setVisible(false)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:16, padding:4 }}>X</button>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {cumpleaneros.map(m => {
          const edad = new Date().getFullYear() - new Date(m.fecha_nacimiento).getFullYear()
          return (
            <div key={m.id} style={{ display:'flex', alignItems:'center', gap:10, background:'var(--bg-card)', borderRadius:10, padding:'8px 12px' }}>
              {m.foto ? (
                <img src={m.foto} style={{ width:36, height:36, borderRadius:'50%', objectFit:'cover', border:'2px solid var(--gold)' }} />
              ) : (
                <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--gold-dim)', border:'2px solid var(--gold)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🎉</div>
              )}
              <div>
                <div style={{ fontWeight:600, fontSize:13 }}>{m.nombres} {m.apellidos}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>Hoy cumple {edad} anos!</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
