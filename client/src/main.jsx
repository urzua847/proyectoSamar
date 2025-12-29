import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Root from './pages/Root';
import Error404 from './pages/Error404';
import ProtectedRoute from './components/ProtectedRoute';
import './styles/styles.css';
import Users from './pages/User';
import Recepcion from './pages/Recepcion';
import Produccion from './pages/Produccion';
import Pedidos from './pages/Pedidos';
import MantenedorProductos from './pages/MantenedorProductos';
import PanelControl from './pages/PanelControl';
import MantenedorEntidades from './pages/MantenedorEntidades';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    errorElement: <Error404 />,
    children: [
      {
        path: '/home',
        element: (
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        )
      },
      {
        path: '/users',
        element: (
          <ProtectedRoute allowedRoles={['administrador']}>
            <Users />
          </ProtectedRoute>
        )
      },
      {
        path: '/recepcion',
        element: (
          <ProtectedRoute allowedRoles={['administrador', 'operario']}>
            <Recepcion />
          </ProtectedRoute>
        )
      },
      {
        path: '/camaras',
        element: (
          <ProtectedRoute allowedRoles={['administrador', 'operario']}>
            <Produccion />
          </ProtectedRoute>
        )
      },
      {
        path: '/contenedores',
        element: (
          <ProtectedRoute allowedRoles={['administrador', 'operario']}>
            <Pedidos />
          </ProtectedRoute>
        )
      },
      {
        path: '/panelDeControl',
        element: (
          <ProtectedRoute allowedRoles={['administrador']}>
            <PanelControl />
          </ProtectedRoute>
        )
      },

      {
        path: '/mantenedor-productos',
        element: (
          <ProtectedRoute allowedRoles={['administrador']}>
            <MantenedorProductos />
          </ProtectedRoute>

        )
      },
      {
        path: '/entidades',
        element: (
          <ProtectedRoute allowedRoles={['administrador']}>
            <MantenedorEntidades />
          </ProtectedRoute>
        )
      }
    ]
  },
  { path: '/auth', element: <Login /> },
  { path: '/register', element: <Register /> }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);