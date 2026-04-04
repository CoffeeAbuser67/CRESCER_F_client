
import type { ColumnDef } from "@tanstack/react-table";
import type { Paciente, MetodoPagamento } from "@/utils/types";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Trash2, Banknote, StickyNote, CreditCard, HeartHandshake, Gift, CheckCircle2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export interface ParcelaTableRow {
    id: string; // Parcela ID
    venda_id: string;
    paciente: Paciente;
    servico: { id: string; nome: string; categoria: string };
    profissional: { id: string; nome: string; ativo: boolean };
    valor_parcela: number;
    data_vencimento: string;
    data_pagamento?: string | null;
    metodo_pagamento?: MetodoPagamento | null;
    status: string;
    observacao?: string;
    numero_parcela: number;
    total_parcelas: number;
}



const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
};

const getPaymentIcon = (method?: string | null) => {
    if (!method) return <span className="text-xs text-muted-foreground">-</span>;
    switch (method) {
        case 'PIX':
            return <div className="flex items-center gap-2"><span className="text-xs font-bold text-green-600">PIX</span></div>;
        case 'DINHEIRO':
            return <div className="flex items-center gap-2"><Banknote className="h-4 w-4 text-green-700" /> <span className="text-xs">Dinheiro</span></div>;
        case 'CREDITO':
            return <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-purple-700" /> <span className="text-xs">Crédito</span></div>;
        case 'DEBITO':
            return <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-blue-700" /> <span className="text-xs">Débito</span></div>;
        case 'CONVENIO':
            return <div className="flex items-center gap-2"><HeartHandshake className="h-4 w-4 text-rose-500" /> <span className="text-xs">Convênio</span></div>;
        case 'CORTESIA':
            return <div className="flex items-center gap-2"><Gift className="h-4 w-4 text-amber-500" /> <span className="text-xs">Cortesia</span></div>;
        default:
            return <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">{method}</span></div>;
    }
}

export const getColumns = (
    onDeleteClick: (id: string) => void,
    onBaixaClick: (parcela: ParcelaTableRow) => void,
    mostrarServico: boolean = false,
    mostrarProfissional: boolean = false
): ColumnDef<ParcelaTableRow>[] => {

    const colunasBase: ColumnDef<ParcelaTableRow>[] = [
        {
            id: "paciente",
            accessorFn: (row) => row.paciente?.nome || "Paciente Avulso",
            header: "Paciente",
            filterFn: (row, columnId, filterValue: string) => {
                const rowValue = row.getValue(columnId) as string;
                if (!rowValue) return false;
                const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                return normalize(rowValue).includes(normalize(filterValue));
            },
            cell: ({ row }) => {
                const nome = row.getValue("paciente") as string;
                return <span className="font-medium text-foreground">{nome}</span>;
            }
        },

        {
            id: "ref",
            header: "Ref.",
            cell: ({ row }) => (
                <span className="text-xs font-medium text-muted-foreground bg-slate-100 px-2 py-1 rounded-md">
                    {row.original.numero_parcela}/{row.original.total_parcelas}
                </span>
            )
        },


        {
            accessorKey: "data_vencimento",
            header: ({ column }) => (
                <Button variant="ghost" className="-ml-4 hover:bg-transparent" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Vencimento <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const val = row.getValue("data_vencimento") as string;
                return val ? format(parseISO(val), "dd/MM/yyyy") : "-";
            }
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("status") as string;
                if (status === "PAGO") return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none shadow-none">Pago</Badge>;
                if (status === "INADIMPLENTE") return <Badge variant="destructive" className="border-none shadow-none">Atrasado</Badge>;
                return <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">Pendente</Badge>;
            }
        }
    ];

    if (mostrarServico) {
        colunasBase.push({
            id: "servico",
            accessorFn: (row) => row.servico?.nome || "-",
            header: "Serviço",
            cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.getValue("servico") as string}</span>
        });
    }

    if (mostrarProfissional) {
        colunasBase.push({
            id: "profissional",
            accessorFn: (row) => row.profissional?.nome || "-",
            header: "Profissional",
            cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.getValue("profissional") as string}</span>
        });
    }

    colunasBase.push(
        {
            accessorKey: "metodo_pagamento",
            header: "Método",
            cell: ({ row }) => getPaymentIcon(row.getValue("metodo_pagamento"))
        },
        {
            accessorKey: "valor_parcela",
            header: () => <div className="text-right">Valor</div>,
            cell: ({ row }) => {
                const amount = parseFloat(row.getValue("valor_parcela"));
                return <div className="text-right font-medium text-slate-900">{formatCurrency(amount)}</div>;
            },
        },
        {
            id: "actions",
            header: () => <div className="text-right px-4">Ações</div>,
            cell: ({ row }) => {
                const obs = row.original.observacao;
                const status = row.original.status;

                return (
                    <div className="flex justify-end gap-2">
                        {status !== 'PAGO' && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                title="Dar Baixa"
                                onClick={() => onBaixaClick(row.original)} // <-- Trigger the action
                            >
                                <CheckCircle2 className="h-4 w-4" />
                            </Button>
                        )}

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost" size="icon" disabled={!obs}
                                    className={cn("h-8 w-8 transition-colors", obs ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50" : "text-muted-foreground/30")}
                                >
                                    <StickyNote className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            {obs && (
                                <PopoverContent className="w-80 p-4 shadow-xl border-2 z-100" align="end">
                                    <div className="space-y-2">
                                        <h4 className="font-semibold leading-none text-sm border-b pb-2 flex items-center gap-2">
                                            <StickyNote className="h-3 w-3" /> Observações do Contrato
                                        </h4>
                                        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap italic">"{obs}"</p>
                                    </div>
                                </PopoverContent>
                            )}
                        </Popover>

                        {/* We use delete on Venda for now, so we pass venda_id */}
                        <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => onDeleteClick(row.original.venda_id)}
                            title="Deletar Contrato/Venda"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                );
            },
        }
    );

    return colunasBase;
};