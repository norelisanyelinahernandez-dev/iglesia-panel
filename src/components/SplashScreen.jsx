import { useEffect, useState } from 'react'

export default function SplashScreen({ onDone }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 400)
    }, 2000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.4s ease'
    }}>
      <img src="/logo.jpg" alt="Logo" style={{
        width: 100, height: 100, borderRadius: '50%',
        objectFit: 'cover', marginBottom: 20,
        boxShadow: '0 0 30px rgba(184,134,11,0.4)'
      }} />
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
        Ministerio San Juan 7:38
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 30 }}>
        Del Semillero 1/11
      </div>
      <div style={{
        width: 40, height: 3, background: 'var(--gold)',
        borderRadius: 2, animation: 'pulse 1s infinite'
      }} />
    </div>
  )
}
