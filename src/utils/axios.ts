import axios from 'axios';

// Instância principal que será interceptada
export const axiosForInterceptor = axios.create({
  baseURL: 'http://localhost:8000', // URL do seu Backend FastAPI
  withCredentials: true, 
  headers: {
    'Content-Type': 'application/json',
  },
});