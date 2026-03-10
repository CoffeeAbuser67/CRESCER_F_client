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
    return <Navigate to="/dashboard/lancamentos" replace />;
  }
  
  return <>{children}</>;
};


export const AdminRoute = ({ children }: GuardProps) => {
  const { user } = useUserStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se o usuário não for ADMIN, chuta ele para o Livro Caixa (onde ele tem permissão)
  if (user.role !== "ADMIN") {
    return <Navigate to="/dashboard/lancamentos" replace />;
  }

  // Se for ADMIN, tapete vermelho: renderiza o componente
  return <>{children}</>;
};