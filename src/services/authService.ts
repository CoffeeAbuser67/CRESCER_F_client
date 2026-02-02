import { axiosForInterceptor } from "../utils/axios";

export const authService = {
  // Chamado pelo Interceptor quando toma 401
  async tryRefreshToken(): Promise<boolean> {
    try {
      // O Backend lê o cookie 'refresh_token', valida e seta novos cookies
      await axiosForInterceptor.post('/auth/refresh');
      return true;
    } catch (error) {
      return false;
    }
  },

  // Logout explícito
  async logout() {
    try {
      await axiosForInterceptor.post('/auth/logout');
    } catch (error) {
      console.error("Erro ao fazer logout no backend", error);
    }
  }
};