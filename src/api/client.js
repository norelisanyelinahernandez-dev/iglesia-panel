import axios from 'axios'

// En desarrollo usa el proxy de Vite (/api → localhost:8000)
// En producción usa VITE_API_URL (tu backend en Render)
const baseURL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL
  : '/api'

const api = axios.create({
  baseURL,
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
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

export const getMinisterios = () => api.get('/ministerios/')
export const getCelulas = () => api.get('/celulas/')
