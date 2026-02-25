import { useState } from 'react'
import Toast from '../components/Toast'
import { getMiembros, getIngresos, getGastos, getEventos, getInventario, getCategoriasIngreso, getCategoriasGasto } from '../api/client'
import ExcelJS from 'exceljs'

// ── Estilos profesionales ────────────────────────────────────────────────────
const COLOR_HEADER_BG  = '1A2E4A'   // azul marino oscuro
const COLOR_HEADER_FG  = 'FFFFFF'   // blanco
const COLOR_FILA_PAR   = 'EEF3FA'   // azul muy claro
const COLOR_FILA_IMPAR = 'FFFFFF'   // blanco
const COLOR_BORDE      = 'B0BEC5'   // gris suave
const FONT_NAME        = 'Calibri'

const estiloCelda = (ws, fila, col, valor, esHeader = false, esPareja = false) => {
  const cell = ws.getCell(fila, col)
  cell.value = valor
  cell.font = {
    name: FONT_NAME,
    bold: esHeader,
    color: { argb: esHeader ? COLOR_HEADER_FG : '1A1A2E' },
    size: esHeader ? 11 : 10,
  }
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: esHeader ? COLOR_HEADER_BG : (esPareja ? COLOR_FILA_PAR : COLOR_FILA_IMPAR) },
  }
  cell.border = {
    top:    { style: 'thin', color: { argb: COLOR_BORDE } },
    left:   { style: 'thin', color: { argb: COLOR_BORDE } },
    bottom: { style: 'thin', color: { argb: COLOR_BORDE } },
    right:  { style: 'thin', color: { argb: COLOR_BORDE } },
  }
  cell.alignment = { vertical: 'middle', wrapText: false }
}

const crearHoja = (wb, nombre, headers, anchos, filas, logoBase64 = null) => {
  const totalCols = headers.length
  const ws = wb.addWorksheet(nombre, {
    views: [{ state: 'frozen', ySplit: 5 }],
  })

  // Anchos de columna
  ws.columns = anchos.map((w, i) => ({ key: String(i), width: w }))

  // ── Fila 1: Logo + Nombre iglesia ──────────────────────────────────────
  ws.getRow(1).height = 36
  // Celda del nombre de la iglesia (col 2 en adelante)
  const celdaNombre = ws.getCell(1, 2)
  celdaNombre.value = 'Iglesia Pentecostal Juan 7:38: El Semillero 1/10'
  celdaNombre.font = { name: 'Calibri', bold: true, size: 16, color: { argb: '1A2E4A' } }
  celdaNombre.alignment = { vertical: 'middle', horizontal: 'left' }
  if (totalCols > 2) ws.mergeCells(1, 2, 1, totalCols)

  // ── Fila 2: Pastora ───────────────────────────────────────────────────
  ws.getRow(2).height = 20
  const celdaPastora = ws.getCell(2, 2)
  celdaPastora.value = 'Pastora: Dinorah Bautista'
  celdaPastora.font = { name: 'Calibri', italic: true, size: 12, color: { argb: '4A6FA5' } }
  celdaPastora.alignment = { vertical: 'middle', horizontal: 'left' }
  if (totalCols > 2) ws.mergeCells(2, 2, 2, totalCols)

  // ── Fila 3: Hoja y fecha de generación ───────────────────────────────
  ws.getRow(3).height = 18
  const celdaInfo = ws.getCell(3, 2)
  const ahora = new Date()
  const fechaStr = ahora.toLocaleDateString('es-DO', { year:'numeric', month:'long', day:'numeric' })
  celdaInfo.value = `${nombre}  ·  Generado el ${fechaStr}`
  celdaInfo.font = { name: 'Calibri', size: 10, color: { argb: '888888' } }
  celdaInfo.alignment = { vertical: 'middle', horizontal: 'left' }
  if (totalCols > 2) ws.mergeCells(3, 2, 3, totalCols)

  // ── Fila 4: separador vacío ───────────────────────────────────────────
  ws.getRow(4).height = 6
  // Línea decorativa en la fila 4
  for (let c = 1; c <= totalCols; c++) {
    const cell = ws.getCell(4, c)
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1A2E4A' } }
  }

  // ── Logo (col 1, filas 1-3 fusionadas) ───────────────────────────────
  if (logoBase64) {
    try {
      const imageId = wb.addImage({ base64: logoBase64, extension: 'jpeg' })
      ws.addImage(imageId, {
        tl: { col: 0, row: 0 },
        br: { col: 1, row: 3 },
        editAs: 'oneCell',
      })
    } catch(_) { mostrarError('Ocurrio un error inesperado. Intenta de nuevo.') }
  }
  // Merge col 1 filas 1-3 para reservar espacio al logo
  try { ws.mergeCells(1, 1, 3, 1) } catch(_) { mostrarError('Ocurrio un error inesperado. Intenta de nuevo.') }

  // ── Fila 5: Encabezados de columnas ──────────────────────────────────
  ws.getRow(5).height = 22
  headers.forEach((h, ci) => estiloCelda(ws, 5, ci + 1, h, true))

  // ── Filas de datos desde fila 6 ──────────────────────────────────────
  filas.forEach((fila, ri) => {
    const rowNum = ri + 6
    ws.getRow(rowNum).height = 16
    fila.forEach((val, ci) => estiloCelda(ws, rowNum, ci + 1, val ?? '', false, ri % 2 === 0))
  })

  // Auto-filtro en fila 5
  ws.autoFilter = {
    from: { row: 5, column: 1 },
    to:   { row: 5, column: headers.length },
  }

  return ws
}

const descargarBlob = async (wb, nombre) => {
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  a.click()
  URL.revokeObjectURL(url)
}

// ── Componente ───────────────────────────────────────────────────────────────
export default function Respaldo() {
  const [toast, setToast] = useState(null)
  const mostrarError = (msg) => setToast({ mensaje: msg, tipo: 'error' })
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')

  // ── Helpers de mapeo ──────────────────────────────────────────────────────
  const obtenerCategorias = async () => {
    const [ci, cg] = await Promise.allSettled([getCategoriasIngreso(), getCategoriasGasto()])
    const mapI = {}
    if (ci.status === 'fulfilled') ci.value.data.forEach(c => { mapI[c.id] = c.nombre })
    const mapG = {}
    if (cg.status === 'fulfilled') cg.value.data.forEach(c => { mapG[c.id] = c.nombre })
    return { mapI, mapG }
  }

  // ── Respaldo completo ─────────────────────────────────────────────────────
  const exportarExcel = async () => {
    setLoading(true); setMensaje('')
    try {
      const [m, i, g, e, inv] = await Promise.allSettled([
        getMiembros({ limit: 1000 }),
        getIngresos({ limit: 1000 }),
        getGastos({ limit: 1000 }),
        getEventos(),
        getInventario({ limit: 1000 }),
      ])
      const { mapI, mapG } = await obtenerCategorias()
      const wb = new ExcelJS.Workbook()
      wb.creator = 'Sistema Iglesia'
      wb.created = new Date()

      // Cargar logo como base64
      let logoBase64 = null
      try {
        const resp = await fetch('/logo_iglesia.jpg')
        if (resp.ok) {
          const buf = await resp.arrayBuffer()
          logoBase64 = btoa(String.fromCharCode(...new Uint8Array(buf)))
        }
      } catch(_) { mostrarError('Ocurrio un error inesperado. Intenta de nuevo.') }

      // Miembros
      const miembrosData = m.status === 'fulfilled' ? m.value.data : []
      crearHoja(wb, 'Miembros',
        ['Nombres','Apellidos','Cédula','Teléfono','Email','Género','Estado Civil','Dirección','Fecha Nacimiento','Fecha Conversión','Fecha Bautismo','Iglesia Bautismo','Tiempo Iglesia','Rol','Estado','Ministerio Actual','Dones y Talentos','Notas'],
        [20,20,14,14,24,12,14,26,16,16,16,22,14,14,12,22,22,26],
        miembrosData.map(x => [
          x.nombres, x.apellidos, x.cedula||'', x.telefono||'', x.email||'',
          x.genero==='M'?'Masculino':x.genero==='F'?'Femenino':x.genero||'',
          x.estado_civil||'', x.direccion||'', x.fecha_nacimiento||'',
          x.fecha_conversion||'', x.fecha_bautismo||'', x.iglesia_bautismo||'',
          x.tiempo_en_iglesia||'', x.rol||'', x.estado||'',
          x.ministerio_actual||'', x.dones_talentos||'', x.notas||'',
        ]), logoBase64
      )

      // Ingresos
      const ingresosData = i.status === 'fulfilled' ? i.value.data : []
      crearHoja(wb, 'Ingresos',
        ['Fecha','Categoría','Monto (RD$)','Descripción'],
        [14,22,14,36],
        ingresosData.map(x => [x.fecha, mapI[x.categoria_id]||'Sin categoría', x.monto, x.descripcion||'']), logoBase64
      )

      // Gastos
      const gastosData = g.status === 'fulfilled' ? g.value.data : []
      crearHoja(wb, 'Gastos',
        ['Fecha','Categoría','Monto (RD$)','Descripción','Beneficiario'],
        [14,22,14,36,22],
        gastosData.map(x => [x.fecha, mapG[x.categoria_id]||'Sin categoría', x.monto, x.descripcion||'', x.beneficiario||'']), logoBase64
      )

      // Eventos
      const eventosData = e.status === 'fulfilled' ? e.value.data : []
      crearHoja(wb, 'Eventos',
        ['Nombre','Fecha','Lugar','Descripción','Estado'],
        [30,14,22,38,12],
        eventosData.map(x => [x.nombre, x.fecha, x.lugar||'', x.descripcion||'', x.estado||'']), logoBase64
      )

      // Inventario
      const inventarioData = inv.status === 'fulfilled' ? inv.value.data : []
      crearHoja(wb, 'Inventario',
        ['Nombre','Categoría','Cantidad','Estado','Descripción'],
        [30,20,10,14,34],
        inventarioData.map(x => [x.nombre, x.categoria||'', x.cantidad, x.estado||'', x.descripcion||'']), logoBase64
      )

      const fecha = new Date().toISOString().split('T')[0]
      await descargarBlob(wb, `respaldo_iglesia_${fecha}.xlsx`)
      setMensaje('Respaldo descargado correctamente')
    } catch(err) {
      console.error(err)
      setMensaje('Error al generar el respaldo')
    }
    setLoading(false)
  }

  // ── Lista de miembros ─────────────────────────────────────────────────────
  const exportarMiembros = async () => {
    setLoading(true); setMensaje('')
    try {
      const { data } = await getMiembros({ limit: 1000 })
      const wb = new ExcelJS.Workbook()
      wb.creator = 'Sistema Iglesia'
      wb.created = new Date()

      let logoBase64 = null
      try {
        const resp = await fetch('/logo_iglesia.jpg')
        if (resp.ok) {
          const buf = await resp.arrayBuffer()
          logoBase64 = btoa(String.fromCharCode(...new Uint8Array(buf)))
        }
      } catch(_) { mostrarError('Ocurrio un error inesperado. Intenta de nuevo.') }

      crearHoja(wb, 'Miembros',
        ['Nombres','Apellidos','Cédula','Teléfono','Email','Género','Estado Civil','Dirección','Fecha Nacimiento','Fecha Conversión','Fecha Bautismo','Iglesia Bautismo','Tiempo Iglesia','Rol','Estado','Ministerio Actual','Ministerios Anteriores','Dones y Talentos','Disponibilidad','Nombre Cónyuge','Nº Hijos','Tel. Emergencia','Visitas Pastorales','Consejería','Motivo Oración','Notas'],
        [20,20,14,14,24,12,14,26,16,16,16,22,14,14,12,22,22,22,14,20,8,18,16,16,24,26],
        data.map(x => [
          x.nombres, x.apellidos, x.cedula||'', x.telefono||'', x.email||'',
          x.genero==='M'?'Masculino':x.genero==='F'?'Femenino':x.genero||'',
          x.estado_civil||'', x.direccion||'', x.fecha_nacimiento||'',
          x.fecha_conversion||'', x.fecha_bautismo||'', x.iglesia_bautismo||'',
          x.tiempo_en_iglesia||'', x.rol||'', x.estado||'',
          x.ministerio_actual||'', x.ministerios_anteriores||'',
          x.dones_talentos||'', x.disponibilidad||'', x.nombre_conyuge||'',
          x.numero_hijos||'', x.telefono_emergencia||'',
          x.visitas_pastorales||'', x.consejeria_pastoral||'',
          x.motivo_oracion||'', x.notas||'',
        ]), logoBase64
      )

      const fecha = new Date().toISOString().split('T')[0]
      await descargarBlob(wb, `miembros_${fecha}.xlsx`)
      setMensaje('Lista de miembros descargada correctamente')
    } catch(err) {
      console.error(err)
      setMensaje('Error al generar el archivo')
    }
    setLoading(false)
  }

  // ── Tesorería ─────────────────────────────────────────────────────────────
  const exportarTesoreria = async () => {
    setLoading(true); setMensaje('')
    try {
      const [i, g] = await Promise.allSettled([
        getIngresos({ limit: 1000 }),
        getGastos({ limit: 1000 }),
      ])
      const { mapI, mapG } = await obtenerCategorias()
      const wb = new ExcelJS.Workbook()
      wb.creator = 'Sistema Iglesia'
      wb.created = new Date()

      let logoBase64 = null
      try {
        const resp = await fetch('/logo_iglesia.jpg')
        if (resp.ok) {
          const buf = await resp.arrayBuffer()
          logoBase64 = btoa(String.fromCharCode(...new Uint8Array(buf)))
        }
      } catch(_) { mostrarError('Ocurrio un error inesperado. Intenta de nuevo.') }

      const ingresosData = i.status === 'fulfilled' ? i.value.data : []
      crearHoja(wb, 'Ingresos',
        ['Fecha','Categoría','Monto (RD$)','Descripción'],
        [14,22,14,36],
        ingresosData.map(x => [x.fecha, mapI[x.categoria_id]||'Sin categoría', x.monto, x.descripcion||'']), logoBase64
      )

      const gastosData = g.status === 'fulfilled' ? g.value.data : []
      crearHoja(wb, 'Gastos',
        ['Fecha','Categoría','Monto (RD$)','Descripción','Beneficiario'],
        [14,22,14,36,22],
        gastosData.map(x => [x.fecha, mapG[x.categoria_id]||'Sin categoría', x.monto, x.descripcion||'', x.beneficiario||'']), logoBase64
      )

      const fecha = new Date().toISOString().split('T')[0]
      await descargarBlob(wb, `tesoreria_${fecha}.xlsx`)
      setMensaje('Datos de tesorería descargados correctamente')
    } catch(err) {
      console.error(err)
      setMensaje('Error al generar el archivo')
    }
    setLoading(false)
  }

  // ── UI ────────────────────────────────────────────────────────────────────
  const opciones = [
    {
      titulo: 'Respaldo completo',
      descripcion: 'Descarga toda la información del sistema en un solo archivo Excel con múltiples hojas: Miembros, Ingresos, Gastos, Eventos e Inventario.',
      icono: '💾',
      color: 'var(--gold)',
      accion: exportarExcel,
    },
    {
      titulo: 'Lista de miembros',
      descripcion: 'Exporta el directorio completo de miembros con todos sus datos personales, espirituales y ministeriales.',
      icono: '👥',
      color: 'var(--green)',
      accion: exportarMiembros,
    },
    {
      titulo: 'Datos de tesorería',
      descripcion: 'Exporta todos los ingresos y gastos registrados en el sistema en formato Excel.',
      icono: '💰',
      color: 'var(--blue)',
      accion: exportarTesoreria,
    },
  ]

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Respaldo de datos</h1>
          <p className="page-subtitle">Exporta la información del sistema en formato Excel profesional</p>
        </div>
      </div>

      {mensaje && (
        <div className={`alert ${mensaje.includes('Error') ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: 20 }}>
          {mensaje.includes('Error') ? '❌' : '✅'} {mensaje}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {opciones.map((op, i) => (
          <div key={i} className="card" style={{ borderLeft: `3px solid ${op.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 36 }}>{op.icono}</span>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{op.titulo}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{op.descripcion}</p>
                </div>
              </div>
              <button onClick={op.accion} disabled={loading} className="btn btn-gold" style={{ flexShrink: 0 }}>
                {loading ? 'Generando...' : 'Descargar Excel'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 24, borderLeft: '3px solid var(--text-muted)' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-muted)' }}>Recomendaciones</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.7 }}>
          Se recomienda hacer un respaldo completo al menos una vez al mes. Los archivos Excel pueden abrirse con Microsoft Excel, Google Sheets o cualquier programa de hojas de cálculo. Guarda los archivos en un lugar seguro como Google Drive o un disco externo.
        </p>
      </div>
      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast(null)} />}

    </div>
  )
}
