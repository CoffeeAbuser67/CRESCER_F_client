import { lazy } from "react";
import { Navigate, RouteObject } from "react-router-dom";

// Layouts
import AuthLayout from "./layouts/AuthLayout";
import DashboardLayout from "./layouts/DashboardLayout";

// Guards (Protetores de Rota)
import { useUserStore } from "./store/userStore";

const LoginPage = lazy(() => import("./pages/home/LoginPage"));
// const DashboardHome = lazy(() => import("./pages/DashboardPage")); 


const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { user, sessionChecked } = useUserStore();
  // Se ainda não checou a sessão, retorna null (o AppInitializer cuida do loading)
  if (!sessionChecked) return null; 
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const { user, sessionChecked } = useUserStore();
  if (!sessionChecked) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
};



const routes: RouteObject[] = [
  {
    path: "/",
    element: (
      <PublicRoute>
        <AuthLayout />
      </PublicRoute>
    ),
    children: [
      { path: "", element: <Navigate to="/login" replace /> }, // Redireciona raiz para login
      { path: "login", element: <LoginPage /> },
      // { path: "register", element: <RegisterPage /> }, // Se tiver registro público
    ],
  },

// 2. Rotas do Painel (Privadas)
//   {
//     path: "/dashboard",
//     element: (
//       <PrivateRoute>
//         <DashboardLayout />
//       </PrivateRoute>
//     ),
//     children: [
//       { path: "", element: <DashboardHome /> },
//       // { path: "medicos", element: <MedicosListPage /> },
//       // { path: "pacientes", element: <PacientesListPage /> },
//     ],
//   },

  // 3. Fallback (404)
  {
    path: "*",
    element: <div className="flex h-screen items-center justify-center">Página não encontrada (404)</div>,
  },
];

export default routes;