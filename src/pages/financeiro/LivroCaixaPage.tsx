import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Calendar as CalendarIcon, FilterX, Stethoscope, Armchair, Loader2 } from "lucide-react";

import { DataTable } from "@/components/data-table"; // Ajuste o import se necessário
import { columns } from "./components/columns"; // Ajuste o path das colunas
import { LancamentoDialog } from "./components/LancamentoDialog";
import { financeiroService } from "@/services/financeiroService";
import type { Lancamento } from "@/utils/types";
import { MultiSelect } from "@/components/multi-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { startOfMonth, endOfMonth, format } from "date-fns";


import { parseDate } from "@internationalized/date";
import { SmartDateRangePicker } from "@/components/date-range-picker-aria";


const TAB_TO_CATEGORY: Record<string, string> = {
  consultas: "CONSULTA",
  terapias: "TERAPIA",
};


export default function LivroCaixaPage() {

  const [activeTab, setActiveTab] = useState("consultas");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [selectedMedicos, setSelectedMedicos] = useState<string[]>([]);


  const [range, setRange] = useState({
    start: parseDate(format(startOfMonth(new Date()), "yyyy-MM-dd")),
    end: parseDate(format(endOfMonth(new Date()), "yyyy-MM-dd"))
  });


  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const BATCH_SIZE = 50;


  const fetchData = useCallback(async (isNewSearch: boolean = false) => {
    setIsLoading(true);
    try {
      const currentPage = isNewSearch ? 0 : page;
      const skip = currentPage * BATCH_SIZE;

      const data = await financeiroService.getLancamentos(
        range.start.toString(),
        range.end.toString(),
        skip,
        BATCH_SIZE
      );

      if (isNewSearch) {
        setLancamentos(data);
        setPage(1);
      } else {
        setLancamentos(prev => [...prev, ...data]);
        setPage(prev => prev + 1);
      }
      setHasMore(data.length === BATCH_SIZE);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [range, page])


  useEffect(() => {
    fetchData(true);
  }, [range]);

  const medicosDisponiveis = Array.from(
    new Map(
      lancamentos
        .filter(l => l.profissional)
        .map(l => [l.profissional!.id, l.profissional!.nome])
    ).entries()
  ).map(([value, label]) => ({ value, label }));

  const medicosFiltrados = selectedMedicos.length > 0
    ? medicosDisponiveis.filter(m => selectedMedicos.includes(m.value))
    : medicosDisponiveis;

  return (

    <div className="h-full flex-1 flex-col space-y-6 p-8 md:flex bg-background">


      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Livro Caixa</h2>
          <p className="text-muted-foreground mt-1">Controle financeiro em tempo real.</p>
        </div>
      </div>




      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="border-b pb-0">
          <TabsList className="bg-transparent h-auto p-0 gap-6">
            <TabsTrigger value="consultas" className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-base">
              <Stethoscope className="mr-2 h-4 w-4" /> Consultas
            </TabsTrigger>
            <TabsTrigger value="terapias" className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-base">
              <Armchair className="mr-2 h-4 w-4" /> Terapias
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="consultas" className="space-y-6">





          <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between bg-muted/20 p-4 rounded-lg border">
            <div className="flex flex-col sm:flex-row flex-1 w-full gap-4 items-center">


              <SmartDateRangePicker
                value={range}
                onChange={setRange}
              />



              <div className="w-full flex-1 max-w-xl flex items-center gap-2">
                <MultiSelect
                  options={medicosDisponiveis}
                  selected={selectedMedicos}
                  onChange={setSelectedMedicos}
                  placeholder="Filtrar Profissionais..."
                  className="bg-background"
                />
                {selectedMedicos.length > 0 && (
                  <Button variant="ghost" size="icon" onClick={() => setSelectedMedicos([])}>
                    <FilterX className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            </div>


            <Button onClick={() => setIsDialogOpen(true)} className="w-full xl:w-auto shadow-md shrink-0">
              <Plus className="mr-2 h-4 w-4" /> Novo Lançamento
            </Button>

          </div>












          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="grid gap-6">
              {medicosFiltrados.map(medico => {

                const dados = lancamentos.filter(l =>
                  l.profissional?.id === medico.value &&
                  l.servico.categoria === TAB_TO_CATEGORY[activeTab]
                );

                const total = dados.reduce((acc, curr) => acc + Number(curr.valor || 0), 0);

                if (dados.length === 0 && selectedMedicos.length === 0) return null;

                return (
                  <Card key={medico.value} className="overflow-hidden shadow-sm border transition-colors">
                    <CardHeader className="bg-muted/10 py-3 flex flex-row items-center justify-between border-b">
                      <CardTitle className="text-lg font-semibold">{medico.label}</CardTitle>
                      <span className="text-sm font-medium">
                        Total: <span className="font-bold">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(total)}</span>
                      </span>
                    </CardHeader>
                    <CardContent className="p-0">
                      <DataTable columns={columns} data={dados} disableGrouping />
                    </CardContent>
                  </Card>
                )
              })}

              {!isLoading && medicosFiltrados.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">Nenhum lançamento encontrado.</div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="terapias">
          <div className="p-10 text-center border-dashed border-2 rounded">
            <p>Em breve: Terapias</p>
          </div>
        </TabsContent>
      </Tabs>


      <LancamentoDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={() => fetchData(true)}
        categoriaFilter={TAB_TO_CATEGORY[activeTab]}
      />



      {hasMore && (
        <div className="flex justify-center pt-8 pb-12">
          <Button
            variant="outline"
            onClick={() => fetchData(false)}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            Carregar mais lançamentos
          </Button>
        </div>
      )}

    </div>
  );
}