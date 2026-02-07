import { Navigate,  } from "react-router-dom";
import { useUserStore } from "@/store/userStore";

interface GuardProps {
  children: React.ReactNode;
}

export const PrivateRoute = ({ children }: GuardProps) => {
  const { user } = useUserStore();
  
  // Se não tem usuário, chuta pro login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se tem usuário, renderiza o filho (DashboardLayout)
  return <>{children}</>;
};

export const PublicRoute = ({ children }: GuardProps) => {
  const { user } = useUserStore();
  
  // Se já tem usuário logado tentando acessar login, manda pro dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Se não tem usuário, deixa ver a página de login
  return <>{children}</>;
};