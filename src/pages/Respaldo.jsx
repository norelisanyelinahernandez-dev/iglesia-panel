import { useState, useEffect } from 'react'
import { getMiembros, getIngresos, getGastos, getEventos, getInventario } from '../api/client'
import * as XLSX from 'xlsx'

export default function Respaldo() {
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const exportarExcel = async () => {
    setLoading(true)
    setMensaje('')
    try {
      const [m, i, g, e, inv] = await Promise.allSettled([
        getMiembros({ limit:1000 }),
        getIngresos({ limit:1000 }),
        getGastos({ limit:1000 }),
        getEventos(),
        getInventario({ limit:1000 }),
      ])

      const wb = XLSX.utils.book_new()

      if (m.status === 'fulfilled') {
        const miembros = m.value.data.map(x => ({
          Nombres: x.nombres,
          Apellidos: x.apellidos,
          Cedula: x.cedula || '',
          Telefono: x.telefono || '',
          Email: x.email || '',
          Genero: x.genero || '',
          Estado_Civil: x.estado_civil || '',
          Direccion: x.direccion || '',
          Fecha_Nacimiento: x.fecha_nacimiento || '',
          Fecha_Conversion: x.fecha_conversion || '',
          Fecha_Bautismo: x.fecha_bautismo || '',
          Iglesia_Bautismo: x.iglesia_bautismo || '',
          Tiempo_Iglesia: x.tiempo_en_iglesia || '',
          Rol: x.rol || '',
          Estado: x.estado || '',
          Ministerio_Actual: x.ministerio_actual || '',
          Dones_Talentos: x.dones_talentos || '',
          Notas: x.notas || '',
        }))
        const ws = XLSX.utils.json_to_sheet(miembros)
        XLSX.utils.book_append_sheet(wb, ws, 'Miembros')
      }

      if (i.status === 'fulfilled') {
        const ingresos = i.value.data.map(x => ({
          Fecha: x.fecha,
          Categoria_ID: x.categoria_id,
          Monto: x.monto,
          Descripcion: x.descripcion || '',
        }))
        const ws = XLSX.utils.json_to_sheet(ingresos)
        XLSX.utils.book_append_sheet(wb, ws, 'Ingresos')
      }

      if (g.status === 'fulfilled') {
        const gastos = g.value.data.map(x => ({
          Fecha: x.fecha,
          Categoria_ID: x.categoria_id,
          Monto: x.monto,
          Descripcion: x.descripcion || '',
          Beneficiario: x.beneficiario || '',
        }))
        const ws = XLSX.utils.json_to_sheet(gastos)
        XLSX.utils.book_append_sheet(wb, ws, 'Gastos')
      }

      if (e.status === 'fulfilled') {
        const eventos = e.value.data.map(x => ({
          Nombre: x.nombre,
          Fecha: x.fecha,
          Lugar: x.lugar || '',
          Descripcion: x.descripcion || '',
          Estado: x.estado || '',
        }))
        const ws = XLSX.utils.json_to_sheet(eventos)
        XLSX.utils.book_append_sheet(wb, ws, 'Eventos')
      }

      if (inv.status === 'fulfilled') {
        const inventario = inv.value.data.map(x => ({
          Nombre: x.nombre,
          Categoria: x.categoria || '',
          Cantidad: x.cantidad,
          Estado: x.estado || '',
          Descripcion: x.descripcion || '',
        }))
        const ws = XLSX.utils.json_to_sheet(inventario)
        XLSX.utils.book_append_sheet(wb, ws, 'Inventario')
      }

      const fecha = new Date().toISOString().split('T')[0]
      XLSX.writeFile(wb, `respaldo_iglesia_${fecha}.xlsx`)
      setMensaje('Respaldo descargado correctamente')
    } catch(err) {
      setMensaje('Error al generar el respaldo')
    }
    setLoading(false)
  }

  const exportarMiembros = async () => {
    setLoading(true)
    setMensaje('')
    try {
      const { data } = await getMiembros({ limit:1000 })
      const miembros = data.map(x => ({
        Nombres: x.nombres,
        Apellidos: x.apellidos,
        Cedula: x.cedula || '',
        Telefono: x.telefono || '',
        Email: x.email || '',
        Genero: x.genero === 'M' ? 'Masculino' : x.genero === 'F' ? 'Femenino' : x.genero || '',
        Estado_Civil: x.estado_civil || '',
        Direccion: x.direccion || '',
        Fecha_Nacimiento: x.fecha_nacimiento || '',
        Fecha_Conversion: x.fecha_conversion || '',
        Fecha_Bautismo: x.fecha_bautismo || '',
        Iglesia_Bautismo: x.iglesia_bautismo || '',
        Tiempo_Iglesia: x.tiempo_en_iglesia || '',
        Rol: x.rol || '',
        Estado: x.estado || '',
        Ministerio_Actual: x.ministerio_actual || '',
        Ministerios_Anteriores: x.ministerios_anteriores || '',
        Dones_Talentos: x.dones_talentos || '',
        Disponibilidad: x.disponibilidad || '',
        Nombre_Conyuge: x.nombre_conyuge || '',
        Numero_Hijos: x.numero_hijos || '',
        Telefono_Emergencia: x.telefono_emergencia || '',
        Visitas_Pastorales: x.visitas_pastorales || '',
        Consejeria_Pastoral: x.consejeria_pastoral || '',
        Motivo_Oracion: x.motivo_oracion || '',
        Notas: x.notas || '',
      }))
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(miembros)
      XLSX.utils.book_append_sheet(wb, ws, 'Miembros')
      const fecha = new Date().toISOString().split('T')[0]
      XLSX.writeFile(wb, `miembros_${fecha}.xlsx`)
      setMensaje('Lista de miembros descargada correctamente')
    } catch(err) {
      setMensaje('Error al generar el archivo')
    }
    setLoading(false)
  }

  const exportarTesoreria = async () => {
    setLoading(true)
    setMensaje('')
    try {
      const [i, g] = await Promise.allSettled([
        getIngresos({ limit:1000 }),
        getGastos({ limit:1000 }),
      ])
      const wb = XLSX.utils.book_new()
      if (i.status === 'fulfilled') {
        const ws = XLSX.utils.json_to_sheet(i.value.data.map(x => ({
          Fecha: x.fecha,
          Categoria_ID: x.categoria_id,
          Monto: x.monto,
          Descripcion: x.descripcion || '',
        })))
        XLSX.utils.book_append_sheet(wb, ws, 'Ingresos')
      }
      if (g.status === 'fulfilled') {
        const ws = XLSX.utils.json_to_sheet(g.value.data.map(x => ({
          Fecha: x.fecha,
          Categoria_ID: x.categoria_id,
          Monto: x.monto,
          Descripcion: x.descripcion || '',
          Beneficiario: x.beneficiario || '',
        })))
        XLSX.utils.book_append_sheet(wb, ws, 'Gastos')
      }
      const fecha = new Date().toISOString().split('T')[0]
      XLSX.writeFile(wb, `tesoreria_${fecha}.xlsx`)
      setMensaje('Datos de tesoreria descargados correctamente')
    } catch(err) {
      setMensaje('Error al generar el archivo')
    }
    setLoading(false)
  }

  const opciones = [
    {
      titulo: 'Respaldo completo',
      descripcion: 'Descarga toda la informacion del sistema en un solo archivo Excel con multiples hojas: Miembros, Ingresos, Gastos, Eventos e Inventario.',
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
      titulo: 'Datos de tesoreria',
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
          <p className="page-subtitle">Exporta la informacion del sistema en formato Excel</p>
        </div>
      </div>

      {mensaje && (
        <div className={`alert ${mensaje.includes('Error') ? 'alert-error' : 'alert-success'}`} style={{ marginBottom:20 }}>
          {mensaje.includes('Error') ? '❌' : '✅'} {mensaje}
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        {opciones.map((op, i) => (
          <div key={i} className="card" style={{ borderLeft:`3px solid ${op.color}` }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
              <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                <span style={{ fontSize:36 }}>{op.icono}</span>
                <div>
                  <h3 style={{ fontFamily:'var(--font-heading)', fontSize:16, fontWeight:700, marginBottom:4 }}>{op.titulo}</h3>
                  <p style={{ color:'var(--text-muted)', fontSize:13 }}>{op.descripcion}</p>
                </div>
              </div>
              <button
                onClick={op.accion}
                disabled={loading}
                className="btn btn-gold"
                style={{ flexShrink:0 }}
              >
                {loading ? 'Generando...' : 'Descargar Excel'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop:24, borderLeft:'3px solid var(--text-muted)' }}>
        <h3 style={{ fontFamily:'var(--font-heading)', fontSize:14, fontWeight:600, marginBottom:8, color:'var(--text-muted)' }}>Recomendaciones</h3>
        <p style={{ color:'var(--text-muted)', fontSize:13, lineHeight:1.7 }}>
          Se recomienda hacer un respaldo completo al menos una vez al mes. Los archivos Excel pueden abrirse con Microsoft Excel, Google Sheets o cualquier programa de hojas de calculo. Guarda los archivos en un lugar seguro como Google Drive o un disco externo.
        </p>
      </div>
    </div>
  )
}
