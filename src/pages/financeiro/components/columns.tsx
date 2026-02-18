import type { ColumnDef } from "@tanstack/react-table";
import type { Lancamento } from "@/utils/types";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Trash2, Banknote, StickyNote, CreditCard } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";


import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";


const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
};

const getPaymentIcon = (method: string) => {
    switch (method) {
        case 'PIX': return <div className="flex items-center gap-2"><span className="text-xs font-bold text-green-600">PIX</span></div>;
        case 'DINHEIRO': return <div className="flex items-center gap-2"><Banknote className="h-4 w-4 text-green-700" /> <span className="text-xs">Dinheiro</span></div>;
        default: return <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-blue-600" /> <span className="text-xs">{method}</span></div>;
    }
}

export const getColumns = (onDeleteClick: (id: string) => void): ColumnDef<Lancamento>[] => [
    {
        id: "paciente", // Definimos um ID claro para conectar com o Input depois
        accessorFn: (row) => row.paciente?.nome || "Paciente Avulso", // Previne erros e permite buscar por "Avulso"
        header: "Paciente",
        filterFn: (row, columnId, filterValue: string) => {
            const rowValue = row.getValue(columnId) as string;
            if (!rowValue) return false;

            // Normaliza a string separando as letras dos acentos e removendo-os depois
            const normalize = (str: string) =>
                str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

            return normalize(rowValue).includes(normalize(filterValue));
        },
        cell: ({ row }) => {
            const nome = row.getValue("paciente") as string;
            return <span className="font-medium text-foreground">{nome}</span>;
        }
    },

    {
        accessorKey: "data_pagamento",
        header: ({ column }) => (
            <Button
                variant="ghost"
                className="-ml-4 hover:bg-transparent"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Pagamento
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const val = row.getValue("data_pagamento") as string;
            return val ? format(parseISO(val), "dd/MM/yyyy") : "-";
        }
    },
    {
        accessorKey: "data_competencia",
        header: ({ column }) => (
            <Button
                variant="ghost"
                className="-ml-4 hover:bg-transparent"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Competência
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const val = row.getValue("data_competencia") as string;
            return (
                <span className="text-muted-foreground text-xs italic">
                    {val ? format(parseISO(val), "dd/MM/yyyy") : "-"}
                </span>
            );
        }
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
        header: () => <div className="text-right px-4">Ações</div>,
        cell: ({ row }) => {
            const obs = row.original.observacao;

            return (
                <div className="flex justify-end gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                disabled={!obs}
                                className={cn(
                                    "h-8 w-8 transition-colors",
                                    obs ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50" : "text-muted-foreground/30"
                                )}
                            >
                                <StickyNote className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>

                        {obs && (
                            <PopoverContent className="w-80 p-4 shadow-xl border-2 z-100" align="end">
                                <div className="space-y-2">
                                    <h4 className="font-semibold leading-none text-sm border-b pb-2 flex items-center gap-2">
                                        <StickyNote className="h-3 w-3" />
                                        Observações
                                    </h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap italic">
                                        "{obs}"
                                    </p>
                                </div>
                            </PopoverContent>
                        )}
                    </Popover>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                            onDeleteClick(row.original.id);
                        }}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            );
        },
    },
];