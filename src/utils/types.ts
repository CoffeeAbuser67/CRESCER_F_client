// Define o formato do Usuário que vem do backend (/auth/me)
export interface User {
  id: number;
  username: string;
  email: string;
  // Adicione aqui outros campos se o seu backend retornar (ex: role, avatar, etc)
  is_active?: boolean;
}

// Define o que precisa enviar para Logar
export interface LoginCredentials {
  username: string; // FastAPI espera 'username' mesmo que você digite o email na tela
  password: string;
}

// Define o que precisa enviar para Registrar
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  // Se tiver confirmação de senha ou outros campos, adicione aqui
}