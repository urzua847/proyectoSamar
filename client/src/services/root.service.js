import axios from 'axios';
import cookies from 'js-cookie';

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
    console.log(`🌐 [API Request] ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ [API Request Error]:', error);
    return Promise.reject(error);
  }
);

// Response interceptor para logging
instance.interceptors.response.use(
  (response) => {
    console.log(`✅ [API Response] ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error(`❌ [API Response Error] ${error.config?.url}:`, {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    return Promise.reject(error);
  }
);

export default instance;