import { Suspense } from "react";
import { Outlet, Link } from "react-router-dom";
import { Loader2, LayoutDashboard, Users, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthService } from "@/hooks/useAuthService"; // Vamos criar esse hook jaja ou usar direto do service

export default function DashboardLayout() {
  const { logout } = useAuthService(); // Assumindo que você tem isso exportado

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-primary">HM Admin ⚕️</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/dashboard">
            <Button variant="ghost" className="w-full justify-start">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link to="/medicos">
            <Button variant="ghost" className="w-full justify-start">
              <Users className="mr-2 h-4 w-4" />
              Médicos
            </Button>
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" className="w-full" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>


      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar Mobile (opcional) */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b flex items-center px-6 md:hidden">
            <span className="font-bold">Menu Mobile Aqui</span>
        </header>

        {/* Area de scroll do conteúdo */}
        <div className="flex-1 overflow-auto p-6">
          <Suspense 
            fallback={
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}