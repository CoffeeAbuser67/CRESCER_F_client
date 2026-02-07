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
};