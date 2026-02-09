import { useState, useMemo } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus, Calendar as CalendarIcon, FilterX, Stethoscope, Armchair } from "lucide-react"
import { DataTable } from "@/components/data-table"
import { columns } from "./components/columns"
import type { Lancamento } from "@/utils/types"
import { MultiSelect } from "@/components/multi-select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function LivroCaixaPage() {
  const [activeTab, setActiveTab] = useState("consultas")
  const [selectedMedicos, setSelectedMedicos] = useState<string[]>([])

  // MOCK DATA (Seus dados de teste)
  const mockData: Lancamento[] = [
    {
        id: "1", data_pagamento: "2024-02-01", data_competencia: "2024-02-01", valor: 350.00, metodo_pagamento: "PIX",
        paciente: { id: "p1", nome: "João da Silva" },
        servico: { id: "s1", nome: "Consulta Cardiológica", categoria: "CONSULTA", preco_padrao: 350 },
        profissional: { id: "med1", nome: "Dr. House", ativo: true }
    },
    {
        id: "2", data_pagamento: "2024-02-02", data_competencia: "2024-02-02", valor: 350.00, metodo_pagamento: "DINHEIRO",
        paciente: { id: "p2", nome: "Maria Souza" },
        servico: { id: "s1", nome: "Consulta Cardiológica", categoria: "CONSULTA", preco_padrao: 350 },
        profissional: { id: "med1", nome: "Dr. House", ativo: true }
    },
    {
        id: "3", data_pagamento: "2024-02-03", data_competencia: "2024-02-03", valor: 400.00, metodo_pagamento: "CARTAO_CREDITO",
        paciente: { id: "p3", nome: "Pedro Alvares" },
        servico: { id: "s2", nome: "Consulta Neuro", categoria: "CONSULTA", preco_padrao: 400 },
        profissional: { id: "med2", nome: "Dra. Grey", ativo: true }
    }
  ]

  const medicoOptions = useMemo(() => {
    const unique = new Map();
    mockData.forEach(l => {
        if(l.profissional) unique.set(l.profissional.id, l.profissional.nome);
    });
    return Array.from(unique.entries()).map(([value, label]) => ({ value, label }));
  }, [mockData]);

  const medicosParaMostrar = selectedMedicos.length > 0 
    ? medicoOptions.filter(m => selectedMedicos.includes(m.value))
    : medicoOptions;

  return (
    <div className="h-full flex-1 flex-col space-y-6 p-8 md:flex bg-background">
      
      {/* 1. Header Fixo com Título */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Livro Caixa</h2>
          <p className="text-muted-foreground mt-1">Gerenciamento de entradas e saídas.</p>
        </div>
      </div>

      {/* 2. Hierarquia Principal: ABAS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        
        {/* Estilo "Page Switcher" - Mais largo e proeminente */}
        <div className="border-b pb-0">
            <TabsList className="bg-transparent h-auto p-0 gap-6">
                <TabsTrigger 
                    value="consultas" 
                    className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-base"
                >
                    <Stethoscope className="mr-2 h-4 w-4" /> 
                    Consultas
                </TabsTrigger>
                <TabsTrigger 
                    value="terapias" 
                    className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-base"
                >
                    <Armchair className="mr-2 h-4 w-4" />
                    Terapias
                </TabsTrigger>
            </TabsList>
        </div>

        {/* CONTEÚDO: CONSULTAS */}
        <TabsContent value="consultas" className="space-y-6 animate-in fade-in-50">
            
            {/* 3. Barra de Controle (Específica de Consulta) */}
            <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between bg-muted/20 p-4 rounded-lg border">
                
                {/* Grupo Esquerdo: Filtros */}
                <div className="flex flex-1 w-full gap-4 items-center">
                    {/* Date Picker (Simulado) */}
                    <Button variant="outline" className="w-60 justify-start text-left font-normal bg-background">
                        <CalendarIcon className="mr-2 h-4 w-4" /> 
                        Fevereiro 2024
                    </Button>

                    {/* Filtro de Médicos (Ocupando espaço) */}
                    <div className="flex-1 max-w-xl flex items-center gap-2">
                        <MultiSelect 
                            options={medicoOptions}
                            selected={selectedMedicos}
                            onChange={setSelectedMedicos}
                            placeholder="Filtrar por Profissionais..."
                            className="bg-background"
                        />
                        {selectedMedicos.length > 0 && (
                            <Button variant="ghost" size="icon" onClick={() => setSelectedMedicos([])}>
                                <FilterX className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Grupo Direito: Ação */}
                <Button size="default" className="w-full md:w-auto shadow-md">
                    <Plus className="mr-2 h-4 w-4" /> Novo Lançamento
                </Button>
            </div>

            {/* 4. Lista de Tabelas (Small Multiples) */}
            <div className="grid gap-6">
                {medicosParaMostrar.map(medico => {
                    const dadosDoMedico = mockData.filter(d => d.profissional?.id === medico.value);
                    const total = dadosDoMedico.reduce((acc, curr) => acc + curr.valor, 0);

                    return (
                        <Card key={medico.value} className="overflow-hidden shadow-sm border hover:border-primary/30 transition-colors">
                            <CardHeader className="bg-muted/10 py-3 flex flex-row items-center justify-between border-b">
                                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                    {medico.label}
                                </CardTitle>
                                <span className="text-sm font-medium text-muted-foreground">
                                    Total: <span className="text-foreground font-bold">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(total)}</span>
                                </span>
                            </CardHeader>
                            <CardContent className="p-0">
                                 {/* Tabela "Limpa" (Sem borda dupla) */}
                                 <DataTable columns={columns} data={dadosDoMedico} disableGrouping={true} />
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </TabsContent>

        {/* CONTEÚDO: TERAPIAS */}
        <TabsContent value="terapias" className="space-y-6 animate-in fade-in-50">
             {/* Barra de Controle Diferente (Sem filtro de médicos) */}
             <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/20 p-4 rounded-lg border">
                <div className="flex gap-4">
                    <Button variant="outline" className="w-60 justify-start text-left font-normal bg-background">
                        <CalendarIcon className="mr-2 h-4 w-4" /> 
                        Fevereiro 2024
                    </Button>
                    {/* Aqui entrará o filtro de Tipos de Terapia no futuro */}
                </div>
                
                <Button size="default" className="bg-teal-600 hover:bg-teal-700 text-white shadow-md">
                    <Plus className="mr-2 h-4 w-4" /> Nova Terapia
                </Button>
            </div>

            <div className="p-20 text-center border-2 border-dashed rounded-xl bg-muted/5">
                <Armchair className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">Visualização de Terapias</h3>
                <p className="text-muted-foreground">Em construção: aqui listaremos os agrupamentos por tipo de serviço.</p>
            </div>
        </TabsContent>

      </Tabs>
    </div>
  )
}
