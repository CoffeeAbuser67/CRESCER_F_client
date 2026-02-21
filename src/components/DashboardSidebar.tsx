import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut, Loader2, Wallet, Settings } from "lucide-react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/userStore";
import { authService } from "@/services/authService";
import { cn } from "@/lib/utils";

export function DashboardSidebar() {
  const navigate = useNavigate();
  const { logout } = useUserStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authService.logout();
      logout();
      toast.info("Sessão encerrada com sucesso.");
      navigate("/login");
    } catch (error) {
      console.error("Erro no logout:", error);
      logout();
      navigate("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    // MUDANÇA 1: Usamos bg-background ou bg-muted/10 para dar um contraste sutil
    // border-r usa a cor da borda do tema, não gray-200 fixo
    <aside className="hidden w-64 flex-col border-r border-border bg-background/95 md:flex">

      {/* Cabeçalho */}
      <div className="flex h-16 items-center border-b border-border px-6">
        {/* text-primary garante que seja preto no light e branco no dark */}
        <h1 className="text-xl font-bold text-primary flex items-center gap-2">
          <span className="text-2xl">⚕️</span> HM Admin
        </h1>
      </div>

      {/* Links de Navegação */}
      <nav className="flex-1 space-y-2 p-4">

        <NavItem to="/dashboard" icon={<LayoutDashboard className="mr-2 h-4 w-4" />}>
          Dashboard
        </NavItem>

        <NavItem to="/dashboard/lancamentos" icon={<Wallet className="mr-2 h-4 w-4" />}>
          Livro Caixa
        </NavItem>

        <NavItem to="/dashboard/configuracoes" icon={<Settings className="mr-2 h-4 w-4" />}>
          Cadastros & Config
        </NavItem>

      </nav>

      {/* Rodapé com Logout */}
      <div className="border-t border-border p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
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

// Componente auxiliar limpo
interface NavItemProps {
  to: string;
  children: React.ReactNode;
  icon: React.ReactNode;
}

function NavItem({ to, children, icon }: NavItemProps) {
  return (
    <NavLink to={to} className="block">
      {({ isActive }) => (
        <Button
          // MUDANÇA 2: Variant 'secondary' ativa automaticamente a cor cinza suave do tema
          variant={isActive ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start transition-all",
            isActive
              ? "font-semibold shadow-sm" // Destaque extra quando ativo
              : "text-muted-foreground hover:text-foreground" // Texto mais apagado quando inativo
          )}
        >
          {icon}
          {children}
        </Button>
      )}
    </NavLink>
  );
}