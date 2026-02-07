import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { DashboardSidebar } from "@/components/DashboardSidebar";

export default function DashboardLayout() {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      
      {/* Sidebar isolada */}
      <DashboardSidebar />

      {/* Conteúdo Principal */}
      <main className="flex flex-1 flex-col overflow-hidden">
        
        {/* Topbar Mobile (Placeholder para futuro menu hambúrguer) */}
        <header className="flex h-16 items-center border-b bg-white px-6 md:hidden dark:bg-gray-800">
           <span className="font-bold">HM Admin Mobile</span>
        </header>

        {/* Área de Scroll do Conteúdo */}
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