import axios from 'axios';
import cookies from 'js-cookie';
import Swal from 'sweetalert2';

const API_URL = '/api'; 
const instance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

instance.interceptors.request.use(
  (config) => {
    const token = cookies.get('jwt-auth');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor para logging y manejo global de errores de red
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Ignorar peticiones canceladas (ej. al cambiar de pestaña rápidamente)
    if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
      return Promise.reject(error);
    }

    // Si no hay respuesta del servidor o el error es explícitamente Network Error
    if (!error.response || error.message === 'Network Error') {
      // Mostrar alerta solo si no hay otra alerta ya visible
      if (!Swal.isVisible()) {
        Swal.fire({
          icon: 'error',
          title: 'Error de Conexión',
          text: 'Se perdió la conexión con el servidor. Verifica tu internet y vuelve a intentarlo.',
          confirmButtonColor: '#0f172a'
        });
      }
    } else {
      console.error(`[API Response Error] ${error.config?.url}:`, {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
    }
    return Promise.reject(error);
  }
);

export default instance;