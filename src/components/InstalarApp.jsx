import { usePWA } from '../utils/usePWA'

export default function InstalarApp() {
  const { promptInstall, instalada, instalar } = usePWA()

  if (instalada) return (
    <div className="card" style={{ marginBottom:20, borderLeft:'3px solid var(--green)', display:'flex', alignItems:'center', gap:12 }}>
      <span style={{ fontSize:24 }}>✅</span>
      <div>
        <div style={{ fontWeight:700 }}>App instalada correctamente</div>
        <div style={{ fontSize:13, color:'var(--text-muted)' }}>Busca el icono en tu pantalla de inicio.</div>
      </div>
    </div>
  )

  if (!promptInstall) return (
    <div className="card" style={{ marginBottom:20, borderLeft:'3px solid var(--gold)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
        <span style={{ fontSize:24 }}>📲</span>
        <div>
          <div style={{ fontWeight:700 }}>Instalar como app</div>
          <div style={{ fontSize:13, color:'var(--text-muted)' }}>Agrega esta app a tu pantalla de inicio para acceder mas rapido.</div>
        </div>
      </div>
      <div style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.8 }}>
        <div><strong>Android (Edge/Chrome):</strong> Menu ⋯ → "Agregar a pantalla de inicio"</div>
        <div><strong>iPhone (Safari):</strong> Boton compartir ⬆️ → "Agregar a pantalla de inicio"</div>
      </div>
    </div>
  )

  return (
    <div className="card" style={{ marginBottom:20, borderLeft:'3px solid var(--gold)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <span style={{ fontSize:32 }}>📲</span>
        <div>
          <div style={{ fontWeight:700 }}>Instalar como app</div>
          <div style={{ fontSize:13, color:'var(--text-muted)' }}>Accede mas rapido desde tu pantalla de inicio.</div>
        </div>
      </div>
      <button className="btn btn-gold" onClick={instalar}>Instalar ahora</button>
    </div>
  )
}
