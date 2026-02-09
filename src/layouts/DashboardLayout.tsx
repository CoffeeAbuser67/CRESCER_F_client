import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { DashboardSidebar } from "@/components/DashboardSidebar";

export default function DashboardLayout() {
  return (
    <div className="flex h-screen">
      
      {/* Sidebar isolada */}
      <DashboardSidebar />

      <main className="flex flex-1 flex-col overflow-hidden">
      
        <div className="flex-1 overflow-auto p-2">
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