/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { Loader2, DollarSign, CalendarDays, AlignLeft, Clock } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { financeiroService } from "@/services/financeiroService";
// Adjust the import path for your types if necessary
import type { Venda } from "@/utils/types";


interface DetalhesVendaSheetProps {
  vendaId: string | null;
  onClose: () => void;
}

export function DetalhesVendaSheet({ vendaId, onClose }: DetalhesVendaSheetProps) {
  const [venda, setVenda] = useState<Venda | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch full contract data when the sheet opens
    async function fetchDetalhes(id: string) {
      setIsLoading(true);
      try {
        const data = await financeiroService.getVendaById(id);
        setVenda(data);
      } catch (error) {
        console.error("Error fetching contract details:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (vendaId) {
      fetchDetalhes(vendaId);
    }

    // Cleanup state on unmount or ID change
    return () => {
      setVenda(null);
    };
  }, [vendaId]);

  // Helper function to safely parse and format dates from the backend
  const safeFormatDate = (dateString: string | undefined | null, formatStr: string) => {
    if (!dateString) return null;
    try {
      // parseISO handles standard backend datetime strings reliably
      const parsedDate = parseISO(dateString);
      if (!isNaN(parsedDate.getTime())) {
        return format(parsedDate, formatStr);
      }
      return null;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return null;
    }
  };

  return (
    <Sheet open={!!vendaId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md md:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl">Detalhes do Contrato</SheetTitle>
          <SheetDescription>
            Acompanhe o status financeiro e o histórico de sessões deste pacote.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col">

            {/* Display observations if they exist */}
            {venda?.observacao && (
              <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2 mb-1.5">
                  <AlignLeft className="h-4 w-4 text-slate-500" />
                  <h4 className="text-sm font-semibold text-slate-700">Observações</h4>
                </div>
                <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {venda.observacao}
                </p>
              </div>
            )}

            <Tabs defaultValue="financeiro" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="financeiro">
                  <DollarSign className="mr-2 h-4 w-4" /> Financeiro
                </TabsTrigger>
                <TabsTrigger value="sessoes">
                  <CalendarDays className="mr-2 h-4 w-4" /> Sessões
                </TabsTrigger>
              </TabsList>

              {/* FINANCIAL TAB */}
              <TabsContent value="financeiro" className="space-y-4 mt-0">
                {!venda?.parcelas || venda.parcelas.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4">Nenhuma parcela encontrada.</p>
                ) : (
                  <div className="space-y-3">
                    {venda.parcelas.map((parcela: any, index: number) => (
                      <div key={parcela.id} className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm">
                        <div>
                          <p className="font-semibold text-sm text-slate-800">
                            Parcela {index + 1} de {venda.parcelas.length}
                          </p>

                          <p className="text-xs text-slate-500 mt-1">
                            Vence em: {safeFormatDate(parcela.data_vencimento, "dd/MM/yyyy") || "--"}
                          </p>

                          {parcela.data_pagamento && safeFormatDate(parcela.data_pagamento, "dd/MM/yyyy") && (
                            <p className="text-xs text-emerald-600 mt-0.5">
                              Paga em: {safeFormatDate(parcela.data_pagamento, "dd/MM/yyyy")}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900 mb-1">
                            {Number(parcela.valor_parcela).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </p>
                          <Badge
                            variant={parcela.status === 'PAGO' ? 'default' : 'secondary'}
                            className={parcela.status === 'PAGO' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                          >
                            {parcela.status || 'PENDENTE'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* SESSIONS TAB (READ-ONLY AUDIT) */}
              <TabsContent value="sessoes" className="space-y-4 mt-0">
                {!venda?.agendamentos || venda.agendamentos.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4">Nenhuma sessão encontrada.</p>
                ) : (
                  <div className="space-y-3">
                    {/* Sort the array by pkid in ascending order before mapping */}
                    {[...venda.agendamentos]
                      .sort((a: any, b: any) => a.pkid - b.pkid)
                      .map((agendamento: any, index: number) => {

                        const rawDate = agendamento.data_competencia;
                        const formattedDate = safeFormatDate(rawDate, "dd/MM/yyyy");

                        // Extract times and ensure they look good (handling nulls and 'HH:mm:ss' format)
                        const horaInicio = agendamento.hora_inicio ? agendamento.hora_inicio.substring(0, 5) : null;
                        const horaFim = agendamento.hora_fim ? agendamento.hora_fim.substring(0, 5) : null;

                        return (
                          <div key={agendamento.id} className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm text-slate-800">
                                  Sessão {index + 1}
                                </p>
                                <Badge
                                  className={`text-[10px] h-5 border-0 font-semibold ${agendamento.status === 'REALIZADO' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' :
                                      agendamento.status === 'FALTA' ? 'bg-amber-500 hover:bg-amber-600 text-white' :
                                        agendamento.status === 'CANCELADO' ? 'bg-red-500 hover:bg-red-600 text-white' :
                                          'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                    }`}
                                >
                                  {agendamento.status || "PENDENTE"}
                                </Badge>
                              </div>

                              <div className="flex flex-col gap-1 mt-2">
                                <p className="text-xs text-slate-600 flex items-center gap-1.5">
                                  <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                                  {formattedDate ? formattedDate : "Data não definida"}
                                </p>

                                {/* Conditionally render time if it exists */}
                                {(horaInicio || horaFim) && (
                                  <p className="text-xs text-slate-600 flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                                    {horaInicio ? horaInicio : "--:--"} às {horaFim ? horaFim : "--:--"}
                                  </p>
                                )}
                              </div>

                              <p className="text-xs text-slate-500 mt-2 border-t pt-1">
                                Profissional: <span className="font-medium text-slate-700">{agendamento.profissional?.nome || "Não definido"}</span>
                              </p>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}