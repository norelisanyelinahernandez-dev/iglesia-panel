import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL
  : '/api'

const api = axios.create({
  baseURL,
  timeout: 15000,
})

// Mostrar notificacion de error global
function mostrarError(mensaje) {
  const existing = document.getElementById('_api_error_toast')
  if (existing) existing.remove()

  const toast = document.createElement('div')
  toast.id = '_api_error_toast'
  toast.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 99999;
    background: #c0392b; color: white; padding: 14px 20px;
    border-radius: 8px; font-size: 14px; font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    max-width: 320px; animation: fadeIn 0.3s ease;
  `
  toast.textContent = mensaje
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 4000)
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status
    const user = (() => { try { return JSON.parse(localStorage.getItem('user')) } catch { return null } })()

    if (status === 401) {
      if (window.location.pathname !== '/login') {
        // Si es usuario admin (email/password), redirigir al login
        if (!user || user.tipo !== 'miembro') {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          window.location.href = '/login'
        } else {
          // Si es miembro con rol especial, mostrar mensaje claro
          mostrarError('Sesion expirada. Por favor cierra sesion e inicia de nuevo.')
        }
      }
    } else if (status === 403) {
      mostrarError('No tienes permiso para realizar esta accion.')
    } else if (status === 404) {
      // Ignorar silenciosamente los 404 de health check
      if (!err.config?.url?.includes('health')) {
        mostrarError('Recurso no encontrado.')
      }
    } else if (status === 422) {
      mostrarError('Datos invalidos. Verifica los campos e intenta de nuevo.')
    } else if (status >= 500) {
      mostrarError('Error en el servidor. Intenta de nuevo en unos momentos.')
    } else if (!err.response) {
      mostrarError('Sin conexion. Verifica tu internet e intenta de nuevo.')
    }

    return Promise.reject(err)
  }
)

export default api

export const login = (email, password) =>
  api.post('/auth/login', { email, password })

export const getMiembros = (params) => api.get('/miembros/', { params })
export const createMiembro = (data) => api.post('/miembros/', data)
export const updateMiembro = (id, data) => api.put(`/miembros/${id}`, data)
export const deleteMiembro = (id) => api.delete(`/miembros/${id}`)

export const getIngresos = (params) => api.get('/tesoreria/ingresos', { params })
export const createIngreso = (data) => api.post('/tesoreria/ingresos', data)
export const getGastos = (params) => api.get('/tesoreria/gastos', { params })
export const createGasto = (data) => api.post('/tesoreria/gastos', data)
export const getResumenMensual = (anio) => api.get('/tesoreria/resumen/mensual', { params: { anio } })
export const getResumenDiezmos = (anio) => api.get('/tesoreria/resumen/diezmos', { params: { anio } })
export const getCategoriasIngreso = () => api.get('/tesoreria/categorias/ingresos')
export const getCategoriasGasto  = () => api.get('/tesoreria/categorias/gastos')

export const getInventario = (params) => api.get('/inventario/', { params })
export const createItem = (data) => api.post('/inventario/', data)
export const updateItem = (id, data) => api.put(`/inventario/${id}`, data)
export const deleteItem = (id) => api.delete(`/inventario/${id}`)
export const getPrestamos = (params) => api.get('/inventario/prestamos', { params })
export const createPrestamo = (data) => api.post('/inventario/prestamos', data)
export const updatePrestamo = (id, data) => api.put(`/inventario/prestamos/${id}`, data)
export const getCategoriasInventario = () => api.get('/inventario/categorias')

export const getEventos = (params) => api.get('/eventos/', { params })
export const createEvento = (data) => api.post('/eventos/', data)
export const deleteEvento = (id) => api.delete(`/eventos/${id}`)
export const getAsistencia = (eventoId) => api.get(`/eventos/${eventoId}/asistencia`)
export const registrarAsistencia = (eventoId, data) => api.post(`/eventos/${eventoId}/asistencia`, data)

export const getMiembroById = (id) => api.get(`/miembros/${id}`)
export const getMinisterios = () => api.get('/ministerios/')
export const getCelulas = () => api.get('/celulas/')

export const deleteIngreso = (id) => api.delete(`/tesoreria/ingresos/${id}`)
export const deleteGasto = (id) => api.delete(`/tesoreria/gastos/${id}`)

// Contenido publico
export const getAnuncios = () => api.get('/contenido/anuncios')
export const createAnuncio = (data) => api.post('/contenido/anuncios', data)
export const updateAnuncio = (id, data) => api.put(`/contenido/anuncios/${id}`, data)
export const deleteAnuncio = (id) => api.delete(`/contenido/anuncios/${id}`)
export const getPastora = () => api.get('/contenido/pastora')
export const savePastora = (data) => api.put('/contenido/pastora', data)
export const getPrograma = (semana) => api.get(`/contenido/programa/${semana}`)
export const getProgramaSemanas = () => api.get('/contenido/programa')
export const savePrograma = (semana, datos) => api.put(`/contenido/programa/${semana}`, { datos })
