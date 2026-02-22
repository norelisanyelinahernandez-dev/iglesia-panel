# 🕊️ Iglesia Panel — Frontend React

Panel de administración completo para el sistema de gestión de iglesia.

## Tecnologías
- **React 18** + **Vite 5**
- **React Router v6** para navegación
- **Axios** para consumo del API
- **Recharts** para gráficas financieras
- **CSS puro** con variables custom (sin frameworks)

## 🚀 Instalación

```bash
# Instalar dependencias
npm install

# Iniciar en desarrollo (requiere que el backend esté corriendo en :8000)
npm run dev

# Construir para producción
npm run build
```

## 📦 Estructura

```
src/
├── api/
│   └── client.js          ← Axios + todos los endpoints
├── components/
│   ├── Layout.jsx          ← Sidebar + estructura general
│   └── Layout.css
├── context/
│   └── AuthContext.jsx     ← Estado de autenticación global
├── pages/
│   ├── Login.jsx           ← Pantalla de login
│   ├── Dashboard.jsx       ← Panel principal con gráficas
│   ├── Miembros.jsx        ← CRUD de creyentes
│   ├── Tesoreria.jsx       ← Ingresos, gastos, diezmos
│   ├── Inventario.jsx      ← Bienes y préstamos
│   └── Eventos.jsx         ← Eventos y asistencia
├── App.jsx                 ← Rutas principales
├── main.jsx
└── index.css               ← Sistema de diseño completo
```

## 🔌 Conexión al backend

El frontend usa un proxy de Vite: todas las peticiones a `/api/*` se redirigen a `http://localhost:8000`.

Si el backend está en otra dirección, edita `vite.config.js`:
```js
target: 'http://tu-servidor:8000'
```

## 📱 Módulos incluidos

| Módulo | Funciones |
|---|---|
| Dashboard | Estadísticas generales + gráfica de ingresos/gastos |
| Miembros | Listar, buscar, crear, editar, eliminar |
| Tesorería | Registrar ingresos y gastos, ver diezmos por miembro |
| Inventario | Items, estados, préstamos y devoluciones |
| Eventos | Crear eventos, registrar asistencia de visitas |

## 🎨 Diseño

Estética "santuario nocturno" — navy profundo con acentos en dorado.
Fuentes: Playfair Display (títulos) + DM Sans (cuerpo).
