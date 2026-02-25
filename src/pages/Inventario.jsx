ï»¿import { useEffect, useState } from 'react'
import DatePicker from '../components/DatePicker'
import { getInventario, createItem, updateItem, deleteItem, getPrestamos, createPrestamo, updatePrestamo, getCategoriasInventario } from '../api/client'

const ESTADO_BADGE = { excelente:'badge-green', bueno:'badge-green', regular:'badge-amber', daÃ±ado:'badge-red', dado_de_baja:'badge-red' }
const PRESTAMO_BADGE = { prestado:'badge-amber', devuelto:'badge-green', perdido:'badge-red' }

const EMPTY_ITEM = { categoria_id:'', nombre:'', descripcion:'', numero_serie:'', marca:'', modelo:'', cantidad:1, estado:'bueno', fecha_adquisicion:'', valor_adquisicion:'', ubicacion:'', notas:'' }

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>Ã</button>
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
      const payload = { ...form, categoria_id: parseInt(form.categoria_id), cantidad: parseInt(form.cantidad), valor_adquisicion: form.valor_adquisicion ? parseFloat(form.valor_adquisicion) : null }
      if (editItem) await updateItem(editItem.id, payload)
      else await createItem(payload)
      await load(); setModal(null)
    } catch(err) { setError(err.response?.data?.detail || 'Error') }
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

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventario</h1>
          <p className="page-subtitle">{items.length} items registrados</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn btn-ghost" onClick={() => { setError(''); setModal('prestamo') }}>Registrar PrÃ©stamo</button>
          <button className="btn btn-gold" onClick={openNew}>+ Agregar item</button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid-4" style={{ marginBottom:24 }}>
        {['excelente','bueno','regular','daÃ±ado'].map(e => (
          <div key={e} className="stat-card">
            <div className="stat-value">{items.filter(i=>i.estado===e).length}</div>
            <div className="stat-label"><span className={`badge ${ESTADO_BADGE[e]}`}>{{'excelente':'Excelente','bueno':'Bueno','regular':'Regular','daÃ±ado':'DaÃ±ado'}[e] || e}</span></div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:20, borderBottom:'1px solid var(--border)' }}>
        {[{id:'items',label:'Items'},{ id:'prestamos',label:`PrÃ©stamos (${prestamos.filter(p=>p.estado==='prestado').length} activos)`}].map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{ background:'none', border:'none', cursor:'pointer', padding:'8px 18px', color:tab===t.id?'var(--gold)':'var(--text-muted)', borderBottom:tab===t.id?'2px solid var(--gold)':'2px solid transparent', fontSize:14, fontWeight:500, transition:'all 0.2s', fontFamily:'var(--font-body)' }}
          >{t.label}</button>
        ))}
      </div>

      {tab === 'items' && (
        <>
          <div style={{ marginBottom:16 }}>
            <div className="search-bar">
              <span className="search-icon">â</span>
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
                      <td style={{ color:'var(--text-muted)' }}>{categorias.find(c=>c.id===i.categoria_id)?.nombre || 'Ã¢â¬â'}</td>
                      <td style={{ fontWeight:600, color:'var(--blue)' }}>{i.cantidad}</td>
                      <td><span className={`badge ${ESTADO_BADGE[i.estado]}`}>{{'excelente':'Excelente','bueno':'Bueno','regular':'Regular','daÃ±ado':'DaÃ±ado','dado_de_baja':'Dado de baja'}[i.estado] || i.estado}</span></td>
                      <td style={{ color:'var(--text-muted)' }}>{i.ubicacion || 'Ã¢â¬â'}</td>
                      <td style={{ color:'var(--text-muted)', fontSize:12 }}>{[i.marca, i.modelo].filter(Boolean).join(' / ') || 'Ã¢â¬â'}</td>
                      <td>
                        <div style={{ display:'flex', gap:6 }}>
                          <button className="btn btn-ghost" style={{ padding:'5px 10px', fontSize:12 }} onClick={()=>openEdit(i)}>Editar</button>
                          <button className="btn btn-danger" style={{ padding:'5px 10px', fontSize:12 }} onClick={()=>handleDelete(i.id)}>â</button>
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
                  ? <tr><td colSpan={6} style={{ textAlign:'center', padding:30, color:'var(--text-muted)' }}>Sin PrÃ©stamos registrados</td></tr>
                  : prestamos.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight:500 }}>{items.find(i=>i.id===p.item_id)?.nombre || p.item_id}</td>
                      <td>{p.nombre_externo || p.miembro_id || 'Ã¢â¬â'}</td>
                      <td style={{ color:'var(--text-muted)' }}>{new Date(p.fecha_salida).toLocaleDateString('es-DO')}</td>
                      <td style={{ color:'var(--text-muted)' }}>{p.fecha_retorno_esperada ? new Date(p.fecha_retorno_esperada).toLocaleDateString('es-DO') : 'Ã¢â¬â'}</td>
                      <td><span className={`badge ${PRESTAMO_BADGE[p.estado]}`}>{{'prestado':'Prestado','devuelto':'Devuelto','perdido':'Perdido'}[p.estado] || p.estado}</span></td>
                      <td>
                        {p.estado === 'prestado' && (
                          <button className="btn btn-ghost" style={{ padding:'5px 12px', fontSize:12 }} onClick={()=>devolverPrestamo(p.id)}>Ã¢Åâ Devolver</button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Item Modal */}
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
                  <option value="">Ã¢â¬— Seleccionar —â</option>
                  {categorias.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Estado</label>
                <select value={form.estado} onChange={e=>setForm({...form,estado:e.target.value})} className="form-input">
                  {[['excelente','Excelente'],['bueno','Bueno'],['regular','Regular'],['daÃ±ado','DaÃ±ado'],['dado_de_baja','Dado de baja']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
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

      {/* Prestamo Modal */}
      {modal === 'prestamo' && (
        <Modal title="Registrar PrÃ©stamo" onClose={()=>setModal(null)}>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={submitPrestamo} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div className="form-group">
              <label className="form-label">Item *</label>
              <select value={prestamoForm.item_id} onChange={e=>setPrestamoForm({...prestamoForm,item_id:e.target.value})} className="form-input" required>
                <option value="">Ã¢â¬— Seleccionar —â</option>
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
              <button type="submit" className="btn btn-gold" disabled={saving}>{saving?'Guardando...':'Registrar PrÃ©stamo'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}



