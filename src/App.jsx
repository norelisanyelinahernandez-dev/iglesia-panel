import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Miembros from './pages/Miembros'
import Tesoreria from './pages/Tesoreria'
import Inventario from './pages/Inventario'
import Eventos from './pages/Eventos'
import Pastora from './pages/Pastora'
function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}
function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/*" element={
        <PrivateRoute>
          <Layout>
            <Routes>
              <Route path="/"           element={<Dashboard />} />
              <Route path="/miembros"   element={<Miembros />} />
              <Route path="/tesoreria"  element={<Tesoreria />} />
              <Route path="/inventario" element={<Inventario />} />
              <Route path="/eventos"    element={<Eventos />} />
              <Route path="/pastora"    element={<Pastora />} />
              <Route path="*"           element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </PrivateRoute>
      } />
    </Routes>
  )
}
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
