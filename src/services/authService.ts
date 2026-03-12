import { api } from "@/lib/api";
import type { LoginCredentials, RegisterData } from "@/utils/types";

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const response = await api.post("/auth/login", {
      email: credentials.username, // Mapeamos o valor do input 'username' para a chave 'email'
      password: credentials.password
    });
    return response.data;
  },

  logout: async () => {
    return await api.post("/auth/logout");
  },

  register: async (data: RegisterData) => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  getUsuarios: async () => {
    const response = await api.get('/auth/usuarios');
    return response.data;
  },

  deleteUsuario: async (id: string) => {
    const response = await api.delete(`/auth/usuarios/${id}`);
    return response.data;
  },  

};

