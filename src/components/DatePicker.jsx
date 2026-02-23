import { useState, useRef, useEffect } from 'react'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS_SEMANA = ['Do','Lu','Ma','Mi','Ju','Vi','Sa']

function parseDate(value) {
  if (!value) return null
  const d = new Date(value + 'T00:00:00')
  return isNaN(d) ? null : d
}

function formatDisplay(date) {
  if (!date) return ''
  return date.toLocaleDateString('es-DO', { day:'2-digit', month:'long', year:'numeric' })
}

function toInputValue(date) {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth()+1).padStart(2,'0')
  const d = String(date.getDate()).padStart(2,'0')
  return y + '-' + m + '-' + d
}

export default function DatePicker({ value, onChange, placeholder, name, required, className }) {
  placeholder = placeholder || 'Seleccionar fecha'
  const [open, setOpen] = useState(false)
  const selected = parseDate(value)
  const today = new Date()
  const [view, setView] = useState(() => {
    const d = parseDate(value)
    return d ? new Date(d.getFullYear(), d.getMonth(), 1) : new Date(today.getFullYear(), today.getMonth(), 1)
  })
  const ref = useRef(null)

  useEffect(() => {
    const d = parseDate(value)
    if (d) setView(new Date(d.getFullYear(), d.getMonth(), 1))
  }, [value])

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const year = view.getFullYear()
  const month = view.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month+1, 0).getDate()

  const prevMonth = () => setView(new Date(year, month-1, 1))
  const nextMonth = () => setView(new Date(year, month+1, 1))

  const selectDay = (day) => {
    const date = new Date(year, month, day)
    onChange({ target: { name, value: toInputValue(date) } })
    setOpen(false)
  }

  const isSelected = (day) => selected && selected.getFullYear()===year && selected.getMonth()===month && selected.getDate()===day
  const isToday = (day) => today.getFullYear()===year && today.getMonth()===month && today.getDate()===day

  const cells = []
  for (let i=0; i<firstDay; i++) cells.push(null)
  for (let d=1; d<=daysInMonth; d++) cells.push(d)

  return (
    <div ref={ref} style={{ position:'relative', width:'100%' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={className || 'form-input'}
        style={{ width:'100%', textAlign:'left', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', color: selected ? 'var(--text)' : 'var(--text-muted)' }}
      >
        <span>{selected ? formatDisplay(selected) : placeholder}</span>
        <span style={{ fontSize:15, opacity:0.5 }}>&#128197;</span>
      </button>

      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, zIndex:1000, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', boxShadow:'var(--shadow-lg)', padding:16, minWidth:280, userSelect:'none' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <button type="button" onClick={prevMonth} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:20, padding:'2px 10px', borderRadius:6 }}>&#8249;</button>
            <div style={{ fontFamily:'var(--font-heading)', fontWeight:600, fontSize:15, color:'var(--gold)' }}>{MESES[month]} {year}</div>
            <button type="button" onClick={nextMonth} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:20, padding:'2px 10px', borderRadius:6 }}>&#8250;</button>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:6 }}>
            {DIAS_SEMANA.map(d => (
              <div key={d} style={{ textAlign:'center', fontSize:11, color:'var(--text-dim)', fontWeight:600, padding:'4px 0' }}>{d}</div>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
            {cells.map((day, i) => (
              <div key={i}>
                {day ? (
                  <button
                    type="button"
                    onClick={() => selectDay(day)}
                    style={{
                      width:'100%', aspectRatio:'1', border:'none', borderRadius:8,
                      fontSize:13, cursor:'pointer',
                      fontWeight: isToday(day) ? 700 : 400,
                      background: isSelected(day) ? 'var(--gold)' : isToday(day) ? 'var(--gold-dim)' : 'transparent',
                      color: isSelected(day) ? '#000' : isToday(day) ? 'var(--gold)' : 'var(--text)',
                    }}
                  >{day}</button>
                ) : <div />}
              </div>
            ))}
          </div>

          <div style={{ marginTop:12, borderTop:'1px solid var(--border)', paddingTop:10, display:'flex', justifyContent:'space-between' }}>
            <button type="button" onClick={() => { onChange({ target:{ name, value:'' } }); setOpen(false) }} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:12 }}>Limpiar</button>
            <button type="button" onClick={() => { onChange({ target:{ name, value: toInputValue(today) } }); setOpen(false) }} style={{ background:'none', border:'none', color:'var(--gold)', cursor:'pointer', fontSize:12, fontWeight:600 }}>Hoy</button>
          </div>
        </div>
      )}
      <input type="hidden" name={name} value={value || ''} required={required} />
    </div>
  )
}