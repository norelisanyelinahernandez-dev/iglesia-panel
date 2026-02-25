import { useEffect, useState } from 'react'
import DatePicker from '../components/DatePicker'
import { getInventario, createItem, updateItem, deleteItem, getPrestamos, createPrestamo, updatePrestamo, getCategoriasInventario } from '../api/client'

// Notificacion de exito
function mostrarExito(mensaje) {
  const existing = document.getElementById('_success_toast')
  if (existing) existing.remove()
  const toast = document.createElement('div')
  toast.id = '_success_toast'
  toast.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 99999;
    background: #27ae60; color: white; padding: 14px 20px;
    border-radius: 8px; font-size: 14px; font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3); max-width: 320px;
  `
  toast.textContent = mensaje
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 3000)
}



// ── Impresión con encabezado institucional ────────────────────────────────
const imprimirConEncabezado = (titulo, htmlContenido) => {
  const fecha = new Date().toLocaleDateString('es-DO', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
  const win = window.open('', '_blank', 'width=900,height=700')
  win.document.write(`<!DOCTYPE html><html lang="es"><head>
    <meta charset="UTF-8"/>
    <title>${titulo}</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family: Calibri, Arial, sans-serif; color: #1a1a2e; padding: 24px 32px; }
      .header { display:flex; align-items:center; gap:20px; border-bottom: 3px solid #1a2e4a; padding-bottom:14px; margin-bottom:18px; }
      .header img { width:72px; height:72px; object-fit:contain; border-radius:8px; }
      .header-info h1 { font-size:17px; font-weight:700; color:#1a2e4a; margin-bottom:3px; }
      .header-info p { font-size:13px; color:#4a6fa5; font-style:italic; margin-bottom:2px; }
      .header-info small { font-size:11px; color:#888; }
      h2 { font-size:15px; font-weight:700; color:#1a2e4a; margin:18px 0 10px; }
      table { width:100%; border-collapse:collapse; font-size:12px; margin-bottom:16px; }
      th { background:#1a2e4a; color:#fff; padding:7px 10px; text-align:left; font-weight:600; }
      td { padding:6px 10px; border-bottom:1px solid #e0e0e0; }
      tr:nth-child(even) td { background:#eef3fa; }
      .badge { display:inline-block; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:600; }
      .badge-green { background:#d4edda; color:#155724; }
      .badge-amber { background:#fff3cd; color:#856404; }
      .badge-red   { background:#f8d7da; color:#721c24; }
      .section { margin-bottom:20px; }
      .stat-row { display:flex; gap:24px; margin-bottom:14px; flex-wrap:wrap; }
      .stat-box { background:#eef3fa; border-radius:8px; padding:12px 20px; text-align:center; }
      .stat-box .val { font-size:22px; font-weight:700; color:#1a2e4a; }
      .stat-box .lbl { font-size:11px; color:#666; }
      .bar-wrap { background:#e0e0e0; border-radius:4px; height:8px; margin-top:4px; }
      .bar { height:8px; border-radius:4px; }
      .footer { margin-top:24px; padding-top:10px; border-top:1px solid #ddd; font-size:11px; color:#aaa; text-align:right; }
      @media print { body { padding:12px 20px; } }
    </style>
  </head><body>
    <div class="header">
      <img src="/logo_iglesia.jpg" onerror="this.style.display='none'" />
      <div class="header-info">
        <h1>Iglesia Pentecostal Juan 7:38: El Semillero 1/10</h1>
        <p>Pastora: Dinorah Bautista</p>
        <small>${titulo} &nbsp;·&nbsp; ${fecha}</small>
      </div>
    </div>
    ${htmlContenido}
    <div class="footer">Generado por el Sistema de Gestión — ${fecha}</div>
  </body></html>`)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print(); win.close() }, 400)
}

const ESTADO_BADGE = { excelente:'badge-green', bueno:'badge-green', regular:'badge-amber', dañado:'badge-red', dado_de_baja:'badge-red' }
const PRESTAMO_BADGE = { prestado:'badge-amber', devuelto:'badge-green', perdido:'badge-red' }
const ESTADO_LABELS = { excelente:'Excelente', bueno:'Bueno', regular:'Regular', dañado:'Dañado', dado_de_baja:'Dado de baja' }
const PRESTAMO_LABELS = { prestado:'Prestado', devuelto:'Devuelto', perdido:'Perdido' }

const EMPTY_ITEM = { categoria_id:'', nombre:'', descripcion:'', numero_serie:'', marca:'', modelo:'', cantidad:1, estado:'bueno', fecha_adquisicion:'', valor_adquisicion:'', ubicacion:'', notas:'' }

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function Inventario() {
  const [items, setItems] = useState([])
  const [prestamos, setPrestamos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('items')
  const [modal, setModal] = useState(null)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(EMPTY_ITEM)
  const [prestamoForm, setPrestamoForm] = useState({ item_id:'', nombre_externo:'', fecha_retorno_esperada:'' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [buscar, setBuscar] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [i, p, c] = await Promise.allSettled([getInventario({ limit:200 }), getPrestamos(), getCategoriasInventario()])
      if (i.status==='fulfilled') setItems(i.value.data)
      if (p.status==='fulfilled') setPrestamos(p.value.data)
      if (c.status==='fulfilled') setCategorias(c.value.data)
    } catch(_) {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = items.filter(i => !buscar || i.nombre.toLowerCase().includes(buscar.toLowerCase()))

  const openEdit = (item) => { setEditItem(item); setForm({ ...EMPTY_ITEM, ...item, categoria_id: item.categoria_id.toString() }); setModal('item') }
  const openNew = () => { setEditItem(null); setForm(EMPTY_ITEM); setModal('item') }

  const submitItem = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const payload = {
        categoria_id: parseInt(form.categoria_id),
        nombre: form.nombre,
        cantidad: parseInt(form.cantidad) || 1,
        estado: form.estado || 'bueno',
        descripcion: form.descripcion || null,
        numero_serie: form.numero_serie || null,
        marca: form.marca || null,
        modelo: form.modelo || null,
        ubicacion: form.ubicacion || null,
        notas: form.notas || null,
        fecha_adquisicion: form.fecha_adquisicion || null,
        valor_adquisicion: form.valor_adquisicion ? parseFloat(form.valor_adquisicion) : null,
      }
      if (editItem) await updateItem(editItem.id, payload)
      else await createItem(payload)
      await load(); setModal(null)
    } catch(err) { setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Error') }
    setSaving(false)
  }

  const submitPrestamo = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await createPrestamo(prestamoForm)
      await load(); setModal(null)
      setPrestamoForm({ item_id:'', nombre_externo:'', fecha_retorno_esperada:'' })
    } catch(err) { setError(err.response?.data?.detail || 'Error') }
    setSaving(false)
  }

  const devolverPrestamo = async (id) => {
    try {
      await updatePrestamo(id, { fecha_retorno_real: new Date().toISOString().split('T')[0], estado:'devuelto' })
      load()
    } catch(_) {}
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este item?')) return
    try { await deleteItem(id); load() } catch(_) {}
  }


  const imprimirInventario = () => {
    const filas = filtered.map(i => {
      const catNombre = categorias.find(c => c.id === i.categoria_id)?.nombre || '—'
      const estadoLabel = { excelente:'Excelente', bueno:'Bueno', regular:'Regular' }[i.estado] || i.estado
      const badgeColor = { excelente:'badge-green', bueno:'badge-green', regular:'badge-amber', dado_de_baja:'badge-red' }[i.estado] || ''
      return `<tr>
        <td>${i.nombre}</td>
        <td>${catNombre}</td>
        <td style="text-align:center">${i.cantidad}</td>
        <td><span class="badge ${badgeColor}">${estadoLabel}</span></td>
        <td>${i.ubicacion || '—'}</td>
        <td>${[i.marca, i.modelo].filter(Boolean).join(' / ') || '—'}</td>
      </tr>`
    }).join('')
    const html = `
      <div class="stat-row">
        <div class="stat-box"><div class="val">${items.length}</div><div class="lbl">Total items</div></div>
        <div class="stat-box"><div class="val">${items.filter(i=>i.estado==='excelente'||i.estado==='bueno').length}</div><div class="lbl">En buen estado</div></div>
        <div class="stat-box"><div class="val">${prestamos.filter(p=>p.estado==='prestado').length}</div><div class="lbl">Préstamos activos</div></div>
      </div>
      <h2>Inventario de Bienes</h2>
      <table>
        <thead><tr><th>Nombre</th><th>Categoría</th><th>Cantidad</th><th>Estado</th><th>Ubicación</th><th>Marca / Modelo</th></tr></thead>
        <tbody>${filas}</tbody>
      </table>`
    imprimirConEncabezado('Inventario', html)
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventario</h1>
          <p className="page-subtitle">{items.length} items registrados</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn btn-ghost" onClick={() => { setError(''); setModal('prestamo') }}>Registrar Préstamo</button>
          <button className="btn btn-ghost" style={{ fontSize:13 }} onClick={imprimirInventario}>🖨️ Imprimir</button>
          <button className="btn btn-gold" onClick={openNew}>+ Agregar item</button>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom:24 }}>
        {['excelente','bueno','regular','dañado'].map(e => (
          <div key={e} className="stat-card">
            <div className="stat-value">{items.filter(i=>i.estado===e).length}</div>
            <div className="stat-label"><span className={`badge ${ESTADO_BADGE[e]}`}>{ESTADO_LABELS[e]}</span></div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:4, marginBottom:20, borderBottom:'1px solid var(--border)' }}>
        {[{id:'items',label:'Items'},{ id:'prestamos',label:`Préstamos (${prestamos.filter(p=>p.estado==='prestado').length} activos)`}].map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{ background:'none', border:'none', cursor:'pointer', padding:'8px 18px', color:tab===t.id?'var(--gold)':'var(--text-muted)', borderBottom:tab===t.id?'2px solid var(--gold)':'2px solid transparent', fontSize:14, fontWeight:500, transition:'all 0.2s', fontFamily:'var(--font-body)' }}
          >{t.label}</button>
        ))}
      </div>

      {tab === 'items' && (
        <>
          <div style={{ marginBottom:16 }}>
            <div className="search-bar">
              <span className="search-icon">⌕</span>
              <input placeholder="Buscar item..." value={buscar} onChange={e=>setBuscar(e.target.value)} />
            </div>
          </div>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Nombre</th><th>Categoría</th><th>Cantidad</th><th>Estado</th><th>Ubicación</th><th>Marca/Modelo</th><th></th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={7} style={{ textAlign:'center', padding:40 }}><span className="spinner"/></td></tr>
                  : filtered.map(i => (
                    <tr key={i.id}>
                      <td style={{ fontWeight:500 }}>{i.nombre}</td>
                      <td style={{ color:'var(--text-muted)' }}>{categorias.find(c=>c.id===i.categoria_id)?.nombre || '—'}</td>
                      <td style={{ fontWeight:600, color:'var(--blue)' }}>{i.cantidad}</td>
                      <td><span className={`badge ${ESTADO_BADGE[i.estado]}`}>{ESTADO_LABELS[i.estado] || i.estado}</span></td>
                      <td style={{ color:'var(--text-muted)' }}>{i.ubicacion || '—'}</td>
                      <td style={{ color:'var(--text-muted)', fontSize:12 }}>{[i.marca, i.modelo].filter(Boolean).join(' / ') || '—'}</td>
                      <td>
                        <div style={{ display:'flex', gap:6 }}>
                          <button className="btn btn-ghost" style={{ padding:'5px 10px', fontSize:12 }} onClick={()=>openEdit(i)}>Editar</button>
                          <button className="btn btn-danger" style={{ padding:'5px 10px', fontSize:12 }} onClick={()=>handleDelete(i.id)}>✕</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'prestamos' && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Item</th><th>Prestado a</th><th>Salida</th><th>Retorno esperado</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={6} style={{ textAlign:'center', padding:40 }}><span className="spinner"/></td></tr>
                : prestamos.length === 0
                  ? <tr><td colSpan={6} style={{ textAlign:'center', padding:30, color:'var(--text-muted)' }}>Sin Préstamos registrados</td></tr>
                  : prestamos.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight:500 }}>{items.find(i=>i.id===p.item_id)?.nombre || p.item_id}</td>
                      <td>{p.nombre_externo || p.miembro_id || '—'}</td>
                      <td style={{ color:'var(--text-muted)' }}>{new Date(p.fecha_salida).toLocaleDateString('es-DO')}</td>
                      <td style={{ color:'var(--text-muted)' }}>{p.fecha_retorno_esperada ? new Date(p.fecha_retorno_esperada).toLocaleDateString('es-DO') : '—'}</td>
                      <td><span className={`badge ${PRESTAMO_BADGE[p.estado]}`}>{PRESTAMO_LABELS[p.estado] || p.estado}</span></td>
                      <td>
                        {p.estado === 'prestado' && (
                          <button className="btn btn-ghost" style={{ padding:'5px 12px', fontSize:12 }} onClick={()=>devolverPrestamo(p.id)}>✓ Devolver</button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal === 'item' && (
        <Modal title={editItem ? `Editar: ${editItem.nombre}` : 'Nuevo item'} onClose={()=>setModal(null)}>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={submitItem} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div className="grid-2">
              <div className="form-group" style={{ gridColumn:'1/-1' }}>
                <label className="form-label">Nombre *</label>
                <input value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} className="form-input" required />
              </div>
              <div className="form-group">
                <label className="form-label">Categoría *</label>
                <select value={form.categoria_id} onChange={e=>setForm({...form,categoria_id:e.target.value})} className="form-input" required>
                  <option value="">— Seleccionar —</option>
                  {categorias.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Estado</label>
                <select value={form.estado} onChange={e=>setForm({...form,estado:e.target.value})} className="form-input">
                  {Object.entries(ESTADO_LABELS).map(([v,l])=><option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Cantidad</label>
                <input type="number" value={form.cantidad} onChange={e=>setForm({...form,cantidad:e.target.value})} className="form-input" min="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Valor adquisición</label>
                <input type="number" value={form.valor_adquisicion} onChange={e=>setForm({...form,valor_adquisicion:e.target.value})} className="form-input" min="0" step="0.01" />
              </div>
              <div className="form-group">
                <label className="form-label">Marca</label>
                <input value={form.marca} onChange={e=>setForm({...form,marca:e.target.value})} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Modelo</label>
                <input value={form.modelo} onChange={e=>setForm({...form,modelo:e.target.value})} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">N° de serie</label>
                <input value={form.numero_serie} onChange={e=>setForm({...form,numero_serie:e.target.value})} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Ubicación</label>
                <input value={form.ubicacion} onChange={e=>setForm({...form,ubicacion:e.target.value})} className="form-input" />
              </div>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
              <button type="button" className="btn btn-ghost" onClick={()=>setModal(null)}>Cancelar</button>
              <button type="submit" className="btn btn-gold" disabled={saving}>{saving?'Guardando...':'Guardar'}</button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'prestamo' && (
        <Modal title="Registrar Préstamo" onClose={()=>setModal(null)}>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={submitPrestamo} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div className="form-group">
              <label className="form-label">Item *</label>
              <select value={prestamoForm.item_id} onChange={e=>setPrestamoForm({...prestamoForm,item_id:e.target.value})} className="form-input" required>
                <option value="">— Seleccionar —</option>
                {items.filter(i=>i.cantidad>0).map(i=><option key={i.id} value={i.id}>{i.nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Prestado a</label>
              <input placeholder="Nombre de quien lo lleva" value={prestamoForm.nombre_externo} onChange={e=>setPrestamoForm({...prestamoForm,nombre_externo:e.target.value})} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha de retorno esperada</label>
              <DatePicker name="fecha_retorno_esperada" value={prestamoForm.fecha_retorno_esperada} onChange={e=>setPrestamoForm({...prestamoForm,fecha_retorno_esperada:e.target.value})} />
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={()=>setModal(null)}>Cancelar</button>
              <button type="submit" className="btn btn-gold" disabled={saving}>{saving?'Guardando...':'Registrar Préstamo'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
