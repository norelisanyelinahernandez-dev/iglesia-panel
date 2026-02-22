import { useEffect, useState } from 'react'
import { getResumenMensual, getMiembros, getEventos, getInventario } from '../api/client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useAuth } from '../context/AuthContext'

const fmt = (n) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }).format(n)

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px' }}>
      <div style={{ color:'var(--text-muted)', fontSize:12, marginBottom:6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, fontSize:13, fontWeight:500 }}>
          {p.name}: {fmt(p.value)}
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [resumen, setResumen] = useState([])
  const [stats, setStats] = useState({ miembros: 0, eventos: 0, inventario: 0, balance: 0 })
  const [loading, setLoading] = useState(true)
  const anio = new Date().getFullYear()

  useEffect(() => {
    const load = async () => {
      try {
        const [r, m, e, inv] = await Promise.allSettled([
          getResumenMensual(anio),
          getMiembros({ estado: 'activo', limit: 1 }),
          getEventos(),
          getInventario({ limit: 1 }),
        ])

        if (r.status === 'fulfilled') {
          const data = r.value.data
          setResumen(data)
          const totalIng = data.reduce((a, b) => a + b.total_ingresos, 0)
          const totalGas = data.reduce((a, b) => a + b.total_gastos, 0)
          setStats(s => ({ ...s, balance: totalIng - totalGas }))
        }
        if (m.status === 'fulfilled') setStats(s => ({ ...s, miembros: m.value.data.length || 0 }))
        if (e.status === 'fulfilled') setStats(s => ({ ...s, eventos: e.value.data.length }))
        if (inv.status === 'fulfilled') setStats(s => ({ ...s, inventario: inv.value.data.length }))
      } catch (_) {}
      setLoading(false)
    }
    load()
  }, [])

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{saludo}, {user?.nombre?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Aquí tienes el resumen del sistema — {new Date().toLocaleDateString('es-DO', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-icon">✦</div>
          <div className="stat-value">{loading ? '—' : stats.miembros}</div>
          <div className="stat-label">Miembros activos</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">◆</div>
          <div className="stat-value">{loading ? '—' : stats.eventos}</div>
          <div className="stat-label">Eventos del año</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">▣</div>
          <div className="stat-value">{loading ? '—' : stats.inventario}</div>
          <div className="stat-label">Items en inventario</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">◉</div>
          <div className="stat-value" style={{ fontSize: stats.balance < 0 ? 22 : 28, color: stats.balance >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {loading ? '—' : fmt(stats.balance)}
          </div>
          <div className="stat-label">Balance {anio}</div>
        </div>
      </div>

      {/* Chart */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily:'var(--font-heading)', fontSize:18, fontWeight:600 }}>Movimientos financieros {anio}</h2>
            <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>Ingresos y gastos mes a mes</p>
          </div>
          <div style={{ display:'flex', gap:16, fontSize:12, color:'var(--text-muted)' }}>
            <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{width:10,height:10,background:'var(--green)',borderRadius:2,display:'inline-block'}}/>Ingresos</span>
            <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{width:10,height:10,background:'var(--red)',borderRadius:2,display:'inline-block'}}/>Gastos</span>
          </div>
        </div>
        {loading ? (
          <div style={{ height:260, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span className="spinner" style={{width:28,height:28}} />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={resumen} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={m => m.split(' ')[0]} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => `${v/1000}k`} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total_ingresos" name="Ingresos" fill="var(--green)" radius={[4,4,0,0]} opacity={0.9} />
              <Bar dataKey="total_gastos"   name="Gastos"   fill="var(--red)"   radius={[4,4,0,0]} opacity={0.9} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Balance table */}
      <div className="card">
        <h2 style={{ fontFamily:'var(--font-heading)', fontSize:17, fontWeight:600, marginBottom:16 }}>Balance por mes</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mes</th>
                <th>Ingresos</th>
                <th>Gastos</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ textAlign:'center', padding:30, color:'var(--text-muted)' }}><span className="spinner" /></td></tr>
              ) : resumen.filter(r => r.total_ingresos > 0 || r.total_gastos > 0).map(r => (
                <tr key={r.mes}>
                  <td style={{ fontWeight:500 }}>{r.mes}</td>
                  <td className="text-green">{fmt(r.total_ingresos)}</td>
                  <td className="text-red">{fmt(r.total_gastos)}</td>
                  <td style={{ fontWeight:600, color: r.balance >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt(r.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
