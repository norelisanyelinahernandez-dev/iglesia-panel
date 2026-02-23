import { useEffect, useState } from 'react'

export default function SplashScreen({ onDone }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
    }, 1800)
    const t2 = setTimeout(() => {
      onDone()
    }, 2200)
    return () => { clearTimeout(t); clearTimeout(t2) }
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#0f1117',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.4s ease',
      pointerEvents: visible ? 'all' : 'none'
    }}>
      <img src="/logo.jpg" alt="Logo" style={{
        width: 100, height: 100, borderRadius: '50%',
        objectFit: 'cover', marginBottom: 20,
        boxShadow: '0 0 30px rgba(184,134,11,0.4)'
      }} />
      <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
        Ministerio San Juan 7:38
      </div>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 30 }}>
        Del Semillero 1/11
      </div>
      <div style={{ width: 40, height: 3, background: '#b8860b', borderRadius: 2 }} />
    </div>
  )
}
