
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/userStore";
import { authService } from "@/services/authService";
import { cn } from "@/lib/utils";

import FlowerICO from "@/assets/flower";

import { NAVIGATION_ITEMS } from "@/utils/navigation";


export function Sidebar() {
  const navigate = useNavigate();
  // Pegamos o usuário do Zustand para checar a role
  const { user, logout } = useUserStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 2. Estado do colapso da sidebar
  const [isCollapsed, setIsCollapsed] = useState(true);

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

  // 3. Filtramos os itens de navegação baseados na Role do usuário
  const allowedNavItems = NAVIGATION_ITEMS.filter(item =>
    user && item.roles.includes(user.role)
  );

  return (
    <aside
      className={cn(
        "hidden flex-col border-r border-border bg-background/95 md:flex transition-all duration-300 relative",
        isCollapsed ? "w-20" : "w-64" // A mágica da largura dinâmica
      )}
    >
      {/* Botão de Toggle da Sidebar */}
      <Button
        variant="secondary"
        size="icon"
        className="absolute -right-4 top-5 h-8 w-8 rounded-full border shadow-md z-10 hidden md:flex cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      {/* Cabeçalho */}
      <div className={cn("flex h-16 items-center border-b border-border", isCollapsed ? "justify-center px-0" : "px-6")}>
        <h1 className="text-xl font-bold text-primary flex items-center gap-2 overflow-hidden whitespace-nowrap">

          <FlowerICO className="h-8 w-8 fill-primary shrink-0" />
          {!isCollapsed && <span>Painel Crescer</span>}
        </h1>
      </div>

      {/* Links de Navegação */}
      <nav className="flex-1 space-y-2 p-4  ">
        {allowedNavItems.map((item) => (
          <NavItem
            key={item.path}
            to={item.path}
            icon={<item.icon className={cn("h-4 w-4 ", !isCollapsed && "mr-2")} />}
            isCollapsed={isCollapsed}
            end={item.end}
          >
            {item.label}
          </NavItem>
        ))}
      </nav>

      {/* Rodapé com Logout */}
      <div className="border-t border-border p-4">
        <Button
          variant="ghost"
          className={cn(
            "w-full text-destructive hover:bg-destructive/10 hover:text-destructive overflow-hidden transition-all cursor-pointer",
            isCollapsed ? "justify-center px-0" : "justify-start"
          )}
          onClick={handleLogout}
          disabled={isLoggingOut}
          title="Sair do Sistema" // Tooltip nativo para quando estiver colapsado
        >
          {isLoggingOut ? (
            <Loader2 className={cn("h-4 w-4 animate-spin", !isCollapsed && "mr-2")} />
          ) : (
            <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
          )}

          {/* Esconde o texto quando colapsado */}
          {!isCollapsed && <span>{isLoggingOut ? "Saindo..." : "Sair"}</span>}
        </Button>
      </div>
    </aside>
  );
}

// Componente auxiliar ajustado para lidar com o colapso
interface NavItemProps {
  to: string;
  children: React.ReactNode;
  icon: React.ReactNode;
  isCollapsed: boolean;
  end?: boolean;
}

function NavItem({ to, children, icon, isCollapsed, end }: NavItemProps) {
  return (
    // Passamos o 'end' para o NavLink do React Router
    <NavLink to={to} end={end} className="block" title={isCollapsed ? children as string : undefined}>
      {({ isActive }) => (
        <Button
          variant={isActive ? "secondary" : "ghost"}
          className={cn(
            "w-full transition-all overflow-hidden cursor-pointer",
            isCollapsed ? "justify-center px-0" : "justify-start",
            isActive
              ? "font-semibold shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {icon}
          {!isCollapsed && <span>{children}</span>}
        </Button>
      )}
    </NavLink>
  );
}