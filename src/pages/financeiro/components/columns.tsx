import type { ColumnDef } from "@tanstack/react-table";
import type { Lancamento } from "@/utils/types";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Pencil, Trash2, Banknote, CreditCard } from "lucide-react";

// Helper para formatar moeda
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

// Helper para ícone de pagamento
const getPaymentIcon = (method: string) => {
  switch (method) {
    case 'PIX': return <div className="flex items-center gap-2"><span className="text-xs font-bold text-green-600">PIX</span></div>;
    case 'DINHEIRO': return <div className="flex items-center gap-2"><Banknote className="h-4 w-4 text-green-700"/> <span className="text-xs">Dinheiro</span></div>;
    default: return <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-blue-600"/> <span className="text-xs">{method}</span></div>;
  }
}

export const columns: ColumnDef<Lancamento>[] = [
  {
    id: "profissional",
    accessorKey: "profissional.nome",
    header: "Profissional",
    enableGrouping: true, 
    cell: ({ row }) => {
       if (row.getIsGrouped()) return null;
       return <span className="text-muted-foreground">{row.original.profissional?.nome || "-"}</span>
    },
  },
  {
    accessorKey: "data_pagamento",
    header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Data
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
    ),
    cell: ({ row }) => {
        const date = new Date(row.getValue("data_pagamento"));
        return date.toLocaleDateString("pt-BR");
    }
  },
  {
    accessorKey: "paciente.nome",
    header: "Paciente",
    cell: ({ row }) => <span className="font-medium">{row.getValue("paciente.nome")}</span>
  },
  {
    accessorKey: "servico.nome",
    header: "Procedimento",
  },
  {
    accessorKey: "metodo_pagamento",
    header: "Pagamento",
    cell: ({ row }) => getPaymentIcon(row.getValue("metodo_pagamento"))
  },
  {
    accessorKey: "valor",
    header: () => <div className="text-right">Valor</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("valor"));
      return <div className="text-right font-medium text-slate-900">{formatCurrency(amount)}</div>;
    },
  },
  {
    id: "actions",
    header: "Ações",
    cell: ({ row }) => {
      return (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];