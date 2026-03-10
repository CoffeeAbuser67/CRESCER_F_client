
import { LayoutDashboard, Wallet, Settings } from "lucide-react";

export const NAVIGATION_ITEMS = [
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN"],
    end: true 
  },
  {
    path: "/dashboard/lancamentos",
    label: "Livro Caixa",
    icon: Wallet,
    roles: ["ADMIN", "COMUM"]
  },
  {
    path: "/dashboard/configuracoes",
    label: "Cadastros & Config",
    icon: Settings,
    roles: ["ADMIN"]
  }
];