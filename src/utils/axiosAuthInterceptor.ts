import { axiosForInterceptor } from "./axios";
import { authService } from "../services/authService";

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

export const setupAxiosInterceptor = (logoutUser: () => void) => {
  axiosForInterceptor.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (!error.response) {
        return Promise.reject(error);
      }

      const is401 = error.response?.status === 401;
      
      // *** AJUSTE AQUI *** // Verificamos se a URL que falhou já não era a própria tentativa de refresh
      // No FastAPI definimos como /auth/refresh
      const isRefreshUrl = originalRequest?.url?.includes("/auth/refresh");

      if (is401 && !isRefreshUrl) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(() => axiosForInterceptor(originalRequest))
            .catch((err) => Promise.reject(err));
        }

        if ((originalRequest as any)._retry) {
          return Promise.reject(error);
        }
        (originalRequest as any)._retry = true;

        isRefreshing = true;

        try {
          // Tenta bater no endpoint /refresh
          const ok = await authService.tryRefreshToken();

          if (ok) {
            processQueue(null);
            console.log('Token renovado com sucesso (Cookie atualizado) 🔄');
            return axiosForInterceptor(originalRequest);
          } else {
            const refreshError = new Error("Sessão expirada.");
            processQueue(refreshError);
            logoutUser(); // Limpa estado no front e redireciona
            return Promise.reject(refreshError);
          }
        } catch (refreshError) {
          processQueue(refreshError as Error);
          logoutUser();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
};