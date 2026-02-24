import { createContext, useContext, useState, useCallback } from 'react'
import { login as apiLogin } from '../api/client'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })

  const loginMiembro = useCallback(async (datos) => {
    const { data } = await api.post('/auth/login-miembro', datos)
    localStorage.setItem('token', data.access_token)
    const userData = { nombre: data.nombre, rol: data.rol, tipo: 'miembro', id: data.id }
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  const loginFn = useCallback(async (email, password) => {
    const { data } = await apiLogin(email, password)
    localStorage.setItem('token', data.access_token)
    const userData = { nombre: data.nombre, rol: data.rol }
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login: loginFn, loginMiembro, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
