import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, LogOut, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/userStore";
import { authService } from "@/services/authService";
import { cn } from "@/lib/utils"; // Utilitário padrão do shadcn para classes condicionais

export function DashboardSidebar() {
  const navigate = useNavigate();
  const { logout } = useUserStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // 1. Avisa o backend para invalidar o refresh token (Cookie)
      await authService.logout();
      
      // 2. Limpa o estado no frontend
      logout();
      
      toast.info("Sessão encerrada com sucesso.");
      navigate("/login");
    } catch (error) {
      console.error("Erro no logout:", error);
      // Mesmo se der erro na API, deslogamos o front para não prender o usuário
      logout();
      navigate("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 md:flex">
      {/* Cabeçalho da Sidebar */}
      <div className="flex h-16 items-center border-b border-gray-200 px-6 dark:border-gray-700">
        <h1 className="text-xl font-bold text-primary">HM Admin ⚕️</h1>
      </div>

      {/* Links de Navegação */}
      <nav className="flex-1 space-y-2 p-4">
        <NavItem to="/dashboard" icon={<LayoutDashboard className="mr-2 h-4 w-4" />}>
          Dashboard
        </NavItem>
        
        <NavItem to="/medicos" icon={<Users className="mr-2 h-4 w-4" />}>
          Médicos
        </NavItem>
      </nav>

      {/* Rodapé com Logout */}
      <div className="border-t border-gray-200 p-4 dark:border-gray-700">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          {isLoggingOut ? "Saindo..." : "Sair do Sistema"}
        </Button>
      </div>
    </aside>
  );
}

// Componente auxiliar para deixar o link ativo visualmente
interface NavItemProps {
  to: string;
  children: React.ReactNode;
  icon: React.ReactNode;
}

function NavItem({ to, children, icon }: NavItemProps) {
  return (
    <NavLink to={to}>
      {({ isActive }) => (
        <Button
          variant={isActive ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start",
            isActive && "bg-gray-100 font-semibold dark:bg-gray-700"
          )}
        >
          {icon}
          {children}
        </Button>
      )}
    </NavLink>
  );
}