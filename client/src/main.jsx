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
        path: '/produccion',
        element: (
          <ProtectedRoute allowedRoles={['administrador', 'operario']}>
            <Produccion />
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