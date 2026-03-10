
import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/userStore";
import { authService } from "@/services/authService";
import { cn } from "@/lib/utils";
import { NAVIGATION_ITEMS } from "@/utils/navigation";
import FlowerICO from "@/assets/flower";

export function MobileNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useUserStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);


  const navRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      // Se a navbar existe, e o clique foi FORA dela, fecha
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside); // Suporte para toque no mobile
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);



  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authService.logout();
      logout();
      toast.info("Sessão encerrada.");
      navigate("/login");
    } catch (error) {
      console.error("Erro no logout:", error);
      logout();
      navigate("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Filtra as rotas permitidas e fecha o menu ao clicar em um link
  const allowedNavItems = NAVIGATION_ITEMS.filter(item => user && item.roles.includes(user.role));
  const handleNavigation = () => setIsOpen(false);

  return (
    <div
      ref={navRef}
      className="flex w-full shrink-0 flex-col border-b border-border bg-background md:hidden z-20"
    >

      <div className="flex h-16 w-full items-center justify-between px-4">

        <h1 className="flex items-center gap-2 text-xl font-bold text-primary">

          <FlowerICO className="h-8 w-8 fill-primary shrink-0" />
          <span>Painel Crescer</span>


        </h1>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {isOpen && (
        <div className="flex flex-col space-y-2 border-t border-border px-4 pb-4 pt-4 shadow-lg">
          {allowedNavItems.map((item) => (
            <NavLink key={item.path} to={item.path} end={item.end} onClick={handleNavigation}>
              {({ isActive }) => (
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start transition-all cursor-pointer",
                    isActive ? "font-semibold shadow-sm" : "text-muted-foreground"
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              )}
            </NavLink>
          ))}

          <div className="mt-2 border-t border-border pt-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:bg-destructive/10 cursor-pointer"
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
        </div>
      )}
    </div>
  );
}