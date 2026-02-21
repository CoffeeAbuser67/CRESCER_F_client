import { useState, useEffect, useCallback, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, FilterX, Stethoscope, Armchair, Loader2 } from "lucide-react";

import { DataTable } from "@/components/data-table";
import { getColumns } from "./components/columns";
import { LancamentoDialog } from "./components/LancamentoDialog";
import { financeiroService } from "@/services/financeiroService";
import type { Lancamento } from "@/utils/types";
import { MultiSelect } from "@/components/multi-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { startOfMonth, endOfMonth, format } from "date-fns";
import { parseDate } from "@internationalized/date";
import { SmartDateRangePicker } from "@/components/date-range-picker-aria";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "react-toastify";
import { Input } from "@/components/ui/input";

const TAB_TO_CATEGORY: Record<string, string> = {
  consultas: "CONSULTA",
  terapias: "TERAPIA",
};


function GroupTableCard({
  group, // Pode ser um Médico ou um Serviço
  dados,
  onDeleteClick,
  globalSearch,
}: {
  group: { label: string; value: string };
  dados: Lancamento[];
  onDeleteClick: (id: string) => void;
  globalSearch: string;
}) {
  const total = dados.reduce((acc, curr) => acc + Number(curr.valor || 0), 0);
  const memoizedColumns = useMemo(() => getColumns(onDeleteClick), [onDeleteClick]);

  return (
    <Card className="overflow-hidden shadow-sm border transition-colors">
      <CardHeader className="bg-muted/10 py-3 flex flex-col items-start justify-between border-b gap-3">
        <div className="w-full flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{group.label}</CardTitle>
          <span className="text-sm font-medium text-muted-foreground">
            Total: <span className="font-bold text-foreground">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(total)}</span>
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <DataTable
          columns={memoizedColumns}
          data={dados}
          searchKey="paciente"
          searchValue={globalSearch}
        />
      </CardContent>
    </Card>
  );
}

export default function LivroCaixaPage() {
  const [activeTab, setActiveTab] = useState("consultas");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);

  // Estados de Filtro
  const [selectedMedicos, setSelectedMedicos] = useState<string[]>([]);

  const [selectedServicos, setSelectedServicos] = useState<string[]>([]); // Novo estado para Terapias
  const [globalPatientSearch, setGlobalPatientSearch] = useState("");

  const [lancamentoToDelete, setLancamentoToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Período
  const [range, setRange] = useState({
    start: parseDate(format(startOfMonth(new Date()), "yyyy-MM-dd")),
    end: parseDate(format(endOfMonth(new Date()), "yyyy-MM-dd"))
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await financeiroService.getLancamentos(
        range.start.toString(),
        range.end.toString(),
        0,
        10000
      );
      setLancamentos(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteConfirm = async () => {
    if (!lancamentoToDelete) return;
    setIsDeleting(true);
    try {
      await financeiroService.deleteLancamento(lancamentoToDelete);
      toast.success("Lançamento excluído com sucesso!");
      setLancamentos((prev) => prev.filter((l) => l.id !== lancamentoToDelete));
    } catch (error) {
      console.error("Erro ao excluir lançamento:", error);
      toast.error("Ocorreu um erro ao tentar excluir o lançamento.");
    } finally {
      setIsDeleting(false);
      setLancamentoToDelete(null);
    }
  };

  // --- DADOS PARA A ABA CONSULTAS ---
  const medicosDisponiveis = Array.from(
    new Map(
      lancamentos
        .filter(l => l.profissional && l.servico.categoria === "CONSULTA")
        .map(l => [l.profissional!.id, l.profissional!.nome])
    ).entries()
  ).map(([value, label]) => ({ value, label }));

  const medicosFiltrados = selectedMedicos.length > 0
    ? medicosDisponiveis.filter(m => selectedMedicos.includes(m.value))
    : medicosDisponiveis;


  // --- DADOS PARA A ABA TERAPIAS ---
  const servicosDisponiveis = Array.from(
    new Map(
      lancamentos
        .filter(l => l.servico && l.servico.categoria === "TERAPIA")
        .map(l => [l.servico.id, l.servico.nome])
    ).entries()
  ).map(([value, label]) => ({ value, label }));

  const servicosFiltrados = selectedServicos.length > 0
    ? servicosDisponiveis.filter(s => selectedServicos.includes(s.value))
    : servicosDisponiveis;


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
            <div className="flex flex-col sm:flex-row flex-1 w-full gap-4 items-center flex-wrap">
              <SmartDateRangePicker
                value={range}
                onChange={setRange}
              />

              <div className="w-full sm:w-auto flex-1 max-w-xl flex items-center gap-2">
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

              <div className="w-full sm:w-64">
                <Input
                  placeholder="Buscar paciente global..."
                  value={globalPatientSearch}
                  onChange={(e) => setGlobalPatientSearch(e.target.value)}
                  className="bg-background w-full"
                />
              </div>
            </div>



            <Button onClick={() => setIsDialogOpen(true)} className="w-full xl:w-auto shadow-md shrink-0">
              <Stethoscope className="mr-2 h-4 w-4" /> Nova Consulta
            </Button>



          </div>

          {
            isLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="grid gap-6">
                {medicosFiltrados.map(medico => {
                  const dados = lancamentos.filter(l =>
                    l.profissional?.id === medico.value &&
                    l.servico.categoria === TAB_TO_CATEGORY.consultas
                  );

                  if (dados.length === 0 && selectedMedicos.length === 0) return null;

                  return (
                    <GroupTableCard
                      key={medico.value}
                      group={medico}
                      dados={dados}
                      onDeleteClick={setLancamentoToDelete}
                      globalSearch={globalPatientSearch}
                    />
                  )
                })}

                {!isLoading && medicosFiltrados.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground">Nenhum lançamento de Consulta encontrado no período.</div>
                )}
              </div>
            )
          }
        </TabsContent>


        <TabsContent value="terapias" className="space-y-6">
          <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between bg-muted/20 p-4 rounded-lg border">
            <div className="flex flex-col sm:flex-row flex-1 w-full gap-4 items-center flex-wrap">

              {/* O Picker de Data é o mesmo (estado compartilhado) */}
              <SmartDateRangePicker
                value={range}
                onChange={setRange}
              />

              {/* Filtro específico de Serviços */}
              <div className="w-full sm:w-auto flex-1 max-w-xl flex items-center gap-2">
                <MultiSelect
                  options={servicosDisponiveis}
                  selected={selectedServicos}
                  onChange={setSelectedServicos}
                  placeholder="Filtrar Terapias..."
                  className="bg-background"
                />
                {selectedServicos.length > 0 && (
                  <Button variant="ghost" size="icon" onClick={() => setSelectedServicos([])}>
                    <FilterX className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>

              {/* Busca de Paciente Global (estado compartilhado) */}
              <div className="w-full sm:w-64">
                <Input
                  placeholder="Buscar paciente global..."
                  value={globalPatientSearch}
                  onChange={(e) => setGlobalPatientSearch(e.target.value)}
                  className="bg-background w-full"
                />
              </div>
            </div>


            <Button
              onClick={() => setIsDialogOpen(true)}
              className="w-full xl:w-auto shadow-md shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Armchair className="mr-2 h-4 w-4" /> Nova Terapia
            </Button>



          </div>

          {
            isLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="grid gap-6">
                {servicosFiltrados.map(servico => {
                  const dados = lancamentos.filter(l =>
                    l.servico?.id === servico.value &&
                    l.servico.categoria === TAB_TO_CATEGORY.terapias
                  );

                  if (dados.length === 0 && selectedServicos.length === 0) return null;

                  return (
                    <GroupTableCard
                      key={servico.value}
                      group={servico} // Passamos o serviço aqui!
                      dados={dados}
                      onDeleteClick={setLancamentoToDelete}
                      globalSearch={globalPatientSearch}
                    />
                  )
                })}

                {!isLoading && servicosFiltrados.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground">Nenhum lançamento de Terapia encontrado no período.</div>
                )}
              </div>
            )
          }
        </TabsContent>

      </Tabs>

      {/* DIALOGS E MODAIS (Compartilhados) */}
      <LancamentoDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={() => fetchData()}
        categoriaFilter={TAB_TO_CATEGORY[activeTab]} // O formulário sabe qual aba estamos!
      />

      <AlertDialog open={!!lancamentoToDelete} onOpenChange={(open) => !open && setLancamentoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o lançamento do banco de dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirm();
              }}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}