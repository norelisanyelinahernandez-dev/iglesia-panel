import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { PermisosProvider, usePermisos } from './context/PermisosContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Miembros from './pages/Miembros'
import Tesoreria from './pages/Tesoreria'
import Inventario from './pages/Inventario'
import Eventos from './pages/Eventos'
import Pastora from './pages/Pastora'
import Programa from './pages/Programa'
import Anuncios from './pages/Anuncios'
import Asistencia from './pages/Asistencia'
import Reportes from './pages/Reportes'
import Respaldo from './pages/Respaldo'
import Finanzas from './pages/Finanzas'
import Documentos from './pages/Documentos'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

function RutaProtegida({ seccion, children }) {
  const { puede } = usePermisos()
  return puede(seccion) ? children : <Navigate to="/" replace />
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/*" element={
        <PrivateRoute>
          <PermisosProvider>
            <Layout>
              <Routes>
                <Route path="/"           element={<Dashboard />} />
                <Route path="/miembros"   element={<RutaProtegida seccion="miembros"><Miembros /></RutaProtegida>} />
                <Route path="/tesoreria"  element={<RutaProtegida seccion="tesoreria"><Tesoreria /></RutaProtegida>} />
                <Route path="/inventario" element={<RutaProtegida seccion="inventario"><Inventario /></RutaProtegida>} />
                <Route path="/eventos"    element={<RutaProtegida seccion="eventos"><Eventos /></RutaProtegida>} />
                <Route path="/pastora"    element={<RutaProtegida seccion="pastora"><Pastora /></RutaProtegida>} />
                <Route path="/programa"   element={<RutaProtegida seccion="programa"><Programa /></RutaProtegida>} />
                <Route path="/anuncios"   element={<RutaProtegida seccion="anuncios"><Anuncios /></RutaProtegida>} />
                <Route path="/asistencia" element={<RutaProtegida seccion="asistencia"><Asistencia /></RutaProtegida>} />
                <Route path="/reportes"   element={<RutaProtegida seccion="reportes"><Reportes /></RutaProtegida>} />
                <Route path="/respaldo"   element={<RutaProtegida seccion="respaldo"><Respaldo /></RutaProtegida>} />
                <Route path="/finanzas"   element={<RutaProtegida seccion="finanzas"><Finanzas /></RutaProtegida>} />
                <Route path="/documentos" element={<RutaProtegida seccion="documentos"><Documentos /></RutaProtegida>} />
                <Route path="*"           element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </PermisosProvider>
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

