import { lazy } from "react";
import { Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom"; // Correção do erro de tipo

// Layouts
import AuthLayout from "./layouts/AuthLayout";
import DashboardLayout from "./layouts/DashboardLayout";

// Guards (Importados do arquivo novo)
import { PublicRoute, PrivateRoute } from "./components/AuthGuards";

// Pages
// Ajuste o caminho conforme sua estrutura real. 
// No seu log de erro parecia ser pages/home/LoginPage
const LoginPage = lazy(() => import("./pages/home/LoginPage"));

// Placeholder temporário pra não quebrar o import
const DashboardPage = lazy(() => import("./pages/DashboardPage")); 


const routes: RouteObject[] = [
  // 1. Rotas de Autenticação (Públicas)
  {
    path: "/",
    element: (
      <PublicRoute>
        <AuthLayout />
      </PublicRoute>
    ),
    children: [
      { path: "", element: <Navigate to="/login" replace /> },
      { path: "login", element: <LoginPage /> },
    ],
  },

  // 2. Rotas do Painel (Privadas)
  {
    path: "/dashboard",
    element: (
      <PrivateRoute>
        <DashboardLayout />
      </PrivateRoute>
    ),
    children: [
      { path: "", element: <DashboardPage /> },
      // { path: "medicos", element: <MedicosList /> },
    ],
  },

  // 3. Fallback (404)
  {
    path: "*",
    element: <div className="flex h-screen items-center justify-center">Página não encontrada (404)</div>,
  },
];

export default routes;