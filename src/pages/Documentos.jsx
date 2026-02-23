import { useState } from 'react'

const STORAGE_KEY = 'documentos_iglesia'

const CATEGORIAS = [
  'Actas',
  'Permisos y licencias',
  'Estatutos',
  'Contratos',
  'Certificados',
  'Financiero',
  'Otro',
]

const emptyForm = () => ({ nombre:'', categoria:'Actas', fecha:'', descripcion:'', url:'', archivo_nombre:'' })

export default function Documentos() {
  const [documentos, setDocumentos] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] }
    catch { return [] }
  })
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [buscar, setBuscar] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [guardado, setGuardado] = useState(false)

  const h = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleArchivo = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setForm(f => ({ ...f, archivo_nombre: file.name, url: ev.target.result }))
    }
    reader.readAsDataURL(file)
  }

  const guardar = () => {
    if (!form.nombre) return
    let nuevos
    if (editando !== null) {
      nuevos = documentos.map((d,i) => i === editando ? { ...form, id: d.id } : d)
      setEditando(null)
    } else {
      nuevos = [{ ...form, id: Date.now(), fecha_subida: new Date().toISOString() }, ...documentos]
    }
    setDocumentos(nuevos)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevos))
    setForm(emptyForm())
    setModal(false)
    setGuardado(true)
    setTimeout(() => setGuardado(false), 3000)
  }

  const eliminar = (id) => {
    if (!confirm('Eliminar este documento?')) return
    const nuevos = documentos.filter(d => d.id !== id)
    setDocumentos(nuevos)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevos))
  }

  const editar = (i) => {
    setForm(documentos[i])
    setEditando(i)
    setModal(true)
  }

  const descargar = (doc) => {
    if (!doc.url) return
    const a = document.createElement('a')
    a.href = doc.url
    a.download = doc.archivo_nombre || doc.nombre
    a.click()
  }

  const ICONOS = {
    'Actas': '📋',
    'Permisos y licencias': '📜',
    'Estatutos': '📖',
    'Contratos': '🤝',
    'Certificados': '🏆',
    'Financiero': '💰',
    'Otro': '📄',
  }

  const filtrados = documentos.filter(d => {
    const coincideBuscar = d.nombre.toLowerCase().includes(buscar.toLowerCase()) || d.descripcion?.toLowerCase().includes(buscar.toLowerCase())
    const coincideCategoria = !filtroCategoria || d.categoria === filtroCategoria
    return coincideBuscar && coincideCategoria
  })

  const porCategoria = CATEGORIAS.map(cat => ({
    cat,
    docs: filtrados.filter(d => d.categoria === cat)
  })).filter(c => c.docs.length > 0)

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Documentos</h1>
          <p className="page-subtitle">{documentos.length} documento{documentos.length !== 1 ? 's' : ''} guardado{documentos.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-gold" onClick={() => { setForm(emptyForm()); setEditando(null); setModal(true) }}>+ Subir documento</button>
      </div>

      {guardado && <div className="alert alert-success" style={{ marginBottom:16 }}>Documento guardado correctamente</div>}

      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <div className="search-bar">
          <span className="search-icon">⌕</span>
          <input placeholder="Buscar documento..." value={buscar} onChange={e => setBuscar(e.target.value)} />
        </div>
        <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} className="form-input" style={{ width:'auto' }}>
          <option value="">Todas las categorias</option>
          {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {filtrados.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📂</div>
          <p>No hay documentos guardados. Sube el primero.</p>
        </div>
      ) : (
        porCategoria.map(({ cat, docs }) => (
          <div key={cat} style={{ marginBottom:24 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
              <span style={{ fontSize:20 }}>{ICONOS[cat]}</span>
              <h3 style={{ fontFamily:'var(--font-heading)', fontSize:15, fontWeight:700, color:'var(--gold)' }}>{cat}</h3>
              <span style={{ color:'var(--text-muted)', fontSize:12 }}>({docs.length})</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {docs.map((doc, i) => (
                <div key={doc.id} className="card" style={{ display:'flex', alignItems:'center', gap:16, padding:'14px 18px' }}>
                  <span style={{ fontSize:32, flexShrink:0 }}>{ICONOS[doc.categoria] || '📄'}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:15, marginBottom:4 }}>{doc.nombre}</div>
                    <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                      {doc.fecha && <span style={{ color:'var(--text-muted)', fontSize:12 }}>Fecha: {new Date(doc.fecha).toLocaleDateString('es-DO')}</span>}
                      {doc.archivo_nombre && <span style={{ color:'var(--text-muted)', fontSize:12 }}>Archivo: {doc.archivo_nombre}</span>}
                      {doc.fecha_subida && <span style={{ color:'var(--text-muted)', fontSize:12 }}>Subido: {new Date(doc.fecha_subida).toLocaleDateString('es-DO')}</span>}
                    </div>
                    {doc.descripcion && <p style={{ color:'var(--text-muted)', fontSize:13, marginTop:4 }}>{doc.descripcion}</p>}
                  </div>
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    {doc.url && (
                      <button className="btn btn-gold" style={{ padding:'5px 12px', fontSize:12 }} onClick={() => descargar(doc)}>
                        Descargar
                      </button>
                    )}
                    <button className="btn btn-ghost" style={{ padding:'5px 10px', fontSize:12 }} onClick={() => editar(documentos.indexOf(doc))}>Editar</button>
                    <button className="btn btn-danger" style={{ padding:'5px 10px', fontSize:12 }} onClick={() => eliminar(doc.id)}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal" style={{ maxWidth:520 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editando !== null ? 'Editar documento' : 'Subir documento'}</h3>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div className="form-group">
                <label className="form-label">Nombre del documento *</label>
                <input name="nombre" value={form.nombre} onChange={h} className="form-input" placeholder="Ej: Acta de fundacion" required />
              </div>
              <div className="grid-2" style={{ gap:12 }}>
                <div className="form-group">
                  <label className="form-label">Categoria</label>
                  <select name="categoria" value={form.categoria} onChange={h} className="form-input">
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha del documento</label>
                  <input name="fecha" type="date" value={form.fecha} onChange={h} className="form-input" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Descripcion</label>
                <textarea name="descripcion" value={form.descripcion} onChange={h} className="form-input" rows={3} style={{ resize:'vertical' }} placeholder="Descripcion breve del documento..." />
              </div>
              <div className="form-group">
                <label className="form-label">Subir archivo (PDF, imagen, Word)</label>
                <input type="file" onChange={handleArchivo} className="form-input" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                {form.archivo_nombre && <div style={{ color:'var(--green)', fontSize:12, marginTop:4 }}>Archivo: {form.archivo_nombre}</div>}
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
                <button className="btn btn-gold" onClick={guardar}>
                  {editando !== null ? 'Actualizar' : 'Guardar documento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
