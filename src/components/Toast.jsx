import { useEffect } from 'react'

export default function Toast({ mensaje, tipo = 'error', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])
  const colores = {
    error:   { bg: 'var(--red)',   icon: 'x' },
    success: { bg: 'var(--green)', icon: 'ok' },
    warning: { bg: 'var(--gold)',  icon: '!' },
  }
  const { bg, icon } = colores[tipo] || colores.error
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: bg, color: '#fff', padding: '12px 20px', borderRadius: 10,
      display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)', fontSize: 14, maxWidth: 360,
    }}>
      <span style={{ flex: 1 }}>{mensaje}</span>
      <button onClick={onClose} style={{
        background: 'transparent', border: 'none', color: '#fff',
        fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: 0,
      }}>x</button>
    </div>
  )
}
