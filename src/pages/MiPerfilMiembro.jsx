import { useEffect, useState } from 'react'
import Toast from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

const fmtDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('es-DO', { day:'2-digit', month:'long', year:'numeric' }) : null
const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : ''
const ROLES_AVANZADOS = ['diacono','lider','maestra','maestro','secretaria','secretario','copastor','copastora','pastor','pastora']

export default function MiPerfilMiembro() {
  const [toast, setToast] = useState(null)
  const mostrarError = (msg) => setToast({ mensaje: msg, tipo: 'error' })
  const { user } = useAuth()
  const [miembro, setMiembro] = useState(null)
  const [totalMiembros, setTotalMiembros] = useState(null)
  const [loading, setLoading] = useState(true)

  const esRolAvanzado = ROLES_AVANZADOS.includes(user?.rol?.toLowerCase())

  useEffect(() => {
    const load = async () => {
      try {
        const m = await api.get('/miembros/me/perfil')
        setMiembro(m.data || null)
        if (esRolAvanzado) {
          try {
            const { getMiembros } = await import('../api/client')
            const todos = await getMiembros({ limit: 500 })
            setTotalMiembros(todos.data.filter(x => x.estado === 'activo').length)
          } catch(_) { mostrarError('Ocurrio un error inesperado. Intenta de nuevo.') }
        }
      } catch(_) { mostrarError('Ocurrio un error inesperado. Intenta de nuevo.') }
      setLoading(false)
    }
    load()
  }, [])

  const InfoRow = ({ icon, label, value }) => value ? (
    <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
      <span style={{ fontSize:16, minWidth:22, textAlign:'center' }}>{icon}</span>
      <div>
        <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:2 }}>{label}</div>
        <div style={{ fontSize:14, fontWeight:500 }}>{value}</div>
      </div>
    </div>
  ) : null

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:60 }}>
      <span className="spinner" style={{ width:36, height:36 }} />
    </div>
  )

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mi Perfil</h1>
          <p className="page-subtitle">{cap(miembro?.rol)} · {cap(miembro?.estado)}</p>
        </div>
      </div>

      {/* Tarjeta de identidad */}
      <div className="card" style={{ marginBottom:20, display:'flex', alignItems:'center', gap:18, background:'linear-gradient(135deg, var(--surface-2), var(--surface))' }}>
        {miembro?.foto ? (
          <img src={miembro.foto} style={{ width:72, height:72, borderRadius:'50%', objectFit:'cover', border:'3px solid var(--gold)', flexShrink:0 }} />
        ) : (
          <div style={{ width:72, height:72, borderRadius:'50%', background:'var(--surface)', border:'3px solid var(--gold)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, flexShrink:0 }}>🙏</div>
        )}
        <div>
          <div style={{ fontSize:11, color:'var(--gold)', fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>Ministerio San Juan 7:38</div>
          <div style={{ fontSize:20, fontWeight:700 }}>{user?.nombre}</div>
          <div style={{ fontSize:13, color:'var(--text-muted)' }}>{cap(miembro?.rol)} · {cap(miembro?.estado)}</div>
        </div>
        {esRolAvanzado && totalMiembros !== null && (
          <div style={{ marginLeft:'auto', textAlign:'center', background:'var(--gold-dim)', border:'1px solid var(--gold)', borderRadius:10, padding:'10px 18px' }}>
            <div style={{ fontSize:24, fontWeight:700, color:'var(--gold)' }}>{totalMiembros}</div>
            <div style={{ fontSize:11, color:'var(--text-muted)' }}>Miembros activos</div>
          </div>
        )}
      </div>

      {/* Información personal */}
      <div className="card">
        <div style={{ borderLeft:'3px solid var(--gold)', paddingLeft:12, marginBottom:16 }}>
          <div style={{ fontWeight:700, fontSize:13, color:'var(--gold)', textTransform:'uppercase', letterSpacing:1 }}>Mi Información</div>
        </div>
        <InfoRow icon="📱" label="Teléfono" value={miembro?.telefono} />
        <InfoRow icon="✉️" label="Correo" value={miembro?.email} />
        <InfoRow icon="🎂" label="Fecha de nacimiento" value={fmtDate(miembro?.fecha_nacimiento)} />
        <InfoRow icon="💧" label="Fecha de bautismo" value={fmtDate(miembro?.fecha_bautismo)} />
        <InfoRow icon="⭐" label="Ministerio" value={miembro?.ministerio_actual} />
        <InfoRow icon="📍" label="Dirección" value={miembro?.direccion} />
        <InfoRow icon="💼" label="Ocupación" value={miembro?.ocupacion} />
      </div>
      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast(null)} />}

    </div>
  )
}
