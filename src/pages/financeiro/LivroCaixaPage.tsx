/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FilterX, Stethoscope, Armchair, Loader2, Microscope } from "lucide-react";

import { DataTable } from "@/components/data-table";
import { getColumns, ParcelaTableRow } from "./components/columns"; 
import { VendaDialog } from "./components/VendaDialog"; 
import { BaixaDialog } from "./components/BaixaDialog"; 
import { financeiroService } from "@/services/financeiroService";
import { MultiSelect } from "@/components/multi-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { startOfMonth, endOfMonth, format } from "date-fns";
import { parseDate } from "@internationalized/date";
import { SmartDateRangePicker } from "@/components/date-range-picker-aria";
import { DetalhesVendaSheet } from "./components/DetalhesVendaSheet";
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
import { useUserStore } from "@/store/userStore";

const TAB_TO_CATEGORY: Record<string, string> = {
  consultas: "CONSULTA",
  terapias: "TERAPIA",
  exames: "EXAME",
};

function GroupTableCard({
  group,
  dados,
  onDeleteClick,
  onBaixaClick,
  onViewClick,
  globalSearch,
  isAdmin,
  mostrarServico,
  mostrarProfissional,
}: {
  group: { label: string; value: string };
  dados: ParcelaTableRow[]; // CHANGED
  onDeleteClick: (id: string) => void;
  onBaixaClick: (parcela: ParcelaTableRow) => void;
  onViewClick: (vendaId: string) => void;
  globalSearch: string;
  isAdmin: boolean;
  mostrarServico?: boolean;
  mostrarProfissional?: boolean;
}) {
  const total = dados.reduce((acc, curr) => acc + Number(curr.valor_parcela || 0), 0); // CHANGED
  const memoizedColumns = useMemo(() =>
    getColumns(onDeleteClick, onBaixaClick, onViewClick, mostrarServico, mostrarProfissional),
    [onDeleteClick, onBaixaClick, onViewClick, mostrarServico, mostrarProfissional]);

  return (
    <Card className="overflow-hidden shadow-sm border transition-colors">
      <CardHeader className="bg-muted/10 py-3 flex flex-col items-start justify-between border-b gap-3">
        <div className="w-full flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{group.label}</CardTitle>

          {/* Conditional rendering: Hide total amount in header if not ADMIN */}
          {isAdmin && (
            <span className="text-sm font-medium text-muted-foreground">
              Total: <span className="font-bold text-foreground">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(total)}</span>
            </span>
          )}

        </div>
      </CardHeader>
      <CardContent className="p-0">
        <DataTable columns={memoizedColumns} data={dados} searchKey="paciente" searchValue={globalSearch} />
      </CardContent>
    </Card>
  );
}

export default function LivroCaixaPage() {
  const [activeTab, setActiveTab] = useState("consultas");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [vendas, setVendas] = useState<any[]>([]); // CHANGED
  const [parcelaParaBaixa, setParcelaParaBaixa] = useState<ParcelaTableRow | null>(null); // ADDED
  const [vendaIdParaDetalhes, setVendaIdParaDetalhes] = useState<string | null>(null);


  // Filter States
  const [selectedMedicos, setSelectedMedicos] = useState<string[]>([]);
  const [selectedServicos, setSelectedServicos] = useState<string[]>([]);
  const [selectedExames, setSelectedExames] = useState<string[]>([]);

  const [globalPatientSearch, setGlobalPatientSearch] = useState("");

  const [lancamentoToDelete, setLancamentoToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { user } = useUserStore();
  const isAdmin = user?.role === 'ADMIN';

  // Date Range (React Aria compliant)
  const [range, setRange] = useState({
    start: parseDate(format(startOfMonth(new Date()), "yyyy-MM-dd")),
    end: parseDate(format(endOfMonth(new Date()), "yyyy-MM-dd"))
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch Vendas instead of Lancamentos
      const data = await financeiroService.getVendas(0, 10000);
      setVendas(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteConfirm = async () => {
    if (!lancamentoToDelete) return;
    setIsDeleting(true);
    try {
      await financeiroService.deleteVenda(lancamentoToDelete); // CHANGED
      toast.success("Venda excluída com sucesso!");
      setVendas((prev) => prev.filter((v) => v.id !== lancamentoToDelete));
    } catch (error) {
      console.error("Erro ao excluir lançamento:", error);
      toast.error("Ocorreu um erro ao tentar excluir o lançamento.");
    } finally {
      setIsDeleting(false);
      setLancamentoToDelete(null);
    }
  };

  // ADDED: Transform Vendas into flat Parcelas based on Date Picker
  const parcelasFlat = useMemo(() => {
    const flat: ParcelaTableRow[] = [];
    const startStr = range.start.toString();
    const endStr = range.end.toString();

    vendas.forEach(venda => {
      const agendamentoPrincipal = venda.agendamentos?.[0];
      if (!agendamentoPrincipal) return;

      const totalParcelas = venda.parcelas.length;

      venda.parcelas.forEach((parcela: any, index: number) => {
        const vencimentoDate = parcela.data_vencimento;

        if (vencimentoDate >= startStr && vencimentoDate <= endStr) {
          flat.push({
            id: parcela.id,
            venda_id: venda.id,
            paciente: venda.paciente,
            servico: agendamentoPrincipal.servico,
            profissional: agendamentoPrincipal.profissional,
            valor_parcela: Number(parcela.valor_parcela),
            data_vencimento: parcela.data_vencimento,
            data_pagamento: parcela.data_pagamento,
            metodo_pagamento: parcela.metodo_pagamento,
            status: parcela.status || 'PENDENTE',
            observacao: venda.observacao,
            numero_parcela: index + 1,
            total_parcelas: totalParcelas,
          });
        }
      });
    });
    return flat;
  }, [vendas, range]);

  // HERE --- DATA FOR CONSULTAS TAB ---
  const medicosDisponiveis = Array.from(
    new Map(
      parcelasFlat // CHANGED
        .filter(p => p.profissional) // Any record that has an associated professional
        .map(p => [p.profissional!.id, p.profissional!.nome])
    ).entries()
  ).map(([value, label]) => ({ value, label }));

  const medicosFiltrados = selectedMedicos.length > 0
    ? medicosDisponiveis.filter(m => selectedMedicos.includes(m.value))
    : medicosDisponiveis;

  // HERE --- DATA FOR TERAPIAS TAB ---
  const servicosDisponiveis = Array.from(
    new Map(
      parcelasFlat // CHANGED
        .filter(p => p.servico && p.servico.categoria === "TERAPIA")
        .map(p => [p.servico.id, p.servico.nome])
    ).entries()
  ).map(([value, label]) => ({ value, label }));

  // HERE --- DATA FOR EXAMES TAB ---
  const examesDisponiveis = Array.from(
    new Map(
      parcelasFlat // CHANGED
        .filter(p => p.servico && p.servico.categoria === "EXAME")
        .map(p => [p.servico.id, p.servico.nome])
    ).entries()
  ).map(([value, label]) => ({ value, label }));

  const examesFiltrados = selectedExames.length > 0
    ? examesDisponiveis.filter(e => selectedExames.includes(e.value))
    : examesDisponiveis;

  return ( // ── ⋙───── DOM───────────➤
    <div className="h-full flex-1 flex-col space-y-6 p-2 md:p-8  md:flex bg-background">
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

            <TabsTrigger value="exames" className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-base">
              <Microscope className="mr-2 h-4 w-4" /> Exames
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
                  const dados = parcelasFlat.filter(p => // CHANGED
                    p.profissional?.id === medico.value &&
                    p.servico.categoria === TAB_TO_CATEGORY.consultas
                  );

                  if (dados.length === 0 && selectedMedicos.length === 0) return null;

                  return (
                    <GroupTableCard
                      key={medico.value}
                      group={medico}
                      dados={dados}
                      onDeleteClick={setLancamentoToDelete}
                      onBaixaClick={setParcelaParaBaixa}
                      onViewClick={setVendaIdParaDetalhes}
                      globalSearch={globalPatientSearch}
                      isAdmin={isAdmin}
                      mostrarServico={false}

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

              {/* Date Picker is the same (shared state) */}
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

              {/* Specific Services Filter */}
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

              {/* Global Patient Search (shared state) */}
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
                {/* Now group by Doctor, same as Consultas tab */}
                {medicosFiltrados.map(medico => {
                  const dados = parcelasFlat.filter(p => // CHANGED
                    p.profissional?.id === medico.value &&
                    p.servico.categoria === TAB_TO_CATEGORY.terapias &&
                    // Apply secondary service filter (if selected)
                    (selectedServicos.length === 0 || selectedServicos.includes(p.servico.id))
                  );

                  // If nothing left, don't render the card
                  if (dados.length === 0) return null;

                  return (
                    <GroupTableCard
                      key={medico.value}
                      group={medico} // Card title is now the Doctor's name
                      dados={dados}
                      onDeleteClick={setLancamentoToDelete}
                      onBaixaClick={setParcelaParaBaixa}
                      onViewClick={setVendaIdParaDetalhes}
                      globalSearch={globalPatientSearch}
                      isAdmin={isAdmin}
                      mostrarServico={true}

                    />
                  )
                })}

                {!isLoading && medicosFiltrados.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground">Nenhum lançamento de Terapia encontrado no período.</div>
                )}
              </div>
            )
          }
        </TabsContent>

        <TabsContent value="exames" className="space-y-6">
          <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between bg-muted/20 p-4 rounded-lg border">
            <div className="flex flex-col sm:flex-row flex-1 w-full gap-4 items-center flex-wrap">

              <SmartDateRangePicker value={range} onChange={setRange} />

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

              {/* Specific Exames Filter */}
              <div className="w-full sm:w-auto flex-1 max-w-xl flex items-center gap-2">
                <MultiSelect
                  options={examesDisponiveis}
                  selected={selectedExames}
                  onChange={setSelectedExames}
                  placeholder="Filtrar Exames..."
                  className="bg-background"
                />
                {selectedExames.length > 0 && (
                  <Button variant="ghost" size="icon" onClick={() => setSelectedExames([])}>
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

            <Button
              onClick={() => setIsDialogOpen(true)}
              className="w-full xl:w-auto shadow-md shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Microscope className="mr-2 h-4 w-4" /> Novo Exame
            </Button>
          </div>

          {
            isLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="grid gap-6">
                {/* INVERSION: Now mapping EXAMES instead of doctors! */}

                {examesFiltrados.map(exame => {

                  const dados = parcelasFlat.filter(p => // CHANGED
                    p.servico?.id === exame.value && // <-- Group by Service ID
                    p.servico.categoria === TAB_TO_CATEGORY.exames &&
                    // Doctors filter acts secondarily INSIDE the exam
                    (selectedMedicos.length === 0 || (p.profissional && selectedMedicos.includes(p.profissional.id)))
                  );

                  if (dados.length === 0) return null;

                  return (
                    <GroupTableCard
                      key={exame.value}
                      group={exame} // Card header is now the Exam name
                      dados={dados}
                      onDeleteClick={setLancamentoToDelete}
                      onBaixaClick={setParcelaParaBaixa}
                      onViewClick={setVendaIdParaDetalhes}
                      globalSearch={globalPatientSearch}
                      isAdmin={isAdmin}
                      mostrarServico={false}     // <-- Hide service column
                      mostrarProfissional={true} // <-- Show professional column
                    />
                  )
                })}

                {!isLoading && examesFiltrados.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground">Nenhum exame encontrado no período.</div>
                )}
              </div>
            )
          }
        </TabsContent>

      </Tabs>

      {/* DIALOGS AND MODALS (Shared) */}
      <VendaDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={() => fetchData()}
        categoriaFilter={TAB_TO_CATEGORY[activeTab]} // The form knows which tab is active!
      />

      <BaixaDialog
        parcela={parcelaParaBaixa}
        onClose={() => setParcelaParaBaixa(null)}
        onSuccess={() => fetchData()}
      />

      <DetalhesVendaSheet
        vendaId={vendaIdParaDetalhes}
        onClose={() => setVendaIdParaDetalhes(null)}
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

      <div className="h-12 shrink-0 w-full block md:hidden" />

    </div>
  );
}