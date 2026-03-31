/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { DollarSign, Users, Activity, TrendingUp, Loader2, Stethoscope, Armchair, Microscope } from "lucide-react";



// Imports Recharts
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, Brush
} from "recharts"



// Imports de Data (React Aria)
import { today, getLocalTimeZone } from '@internationalized/date';
import { SmartDateRangePicker } from "@/components/date-range-picker-aria";

import { financeiroService } from "@/services/financeiroService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";

export default function DashboardPage() {
  const [dados, setDados] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hoje = today(getLocalTimeZone());
  const [dateRange, setDateRange] = useState({
    start: hoje.set({ day: 1 }), //dia 01 do mês corrente
    end: hoje
  });

  useEffect(() => {
    const carregarDashboard = async () => {
      // Se não tem start ou end (usuário limpou o input), não faz request
      if (!dateRange || !dateRange.start || !dateRange.end) return;

      setIsLoading(true);
      try {
        // Converte o objeto do react-aria para string 'YYYY-MM-DD'
        const startStr = dateRange.start.toString();
        const endStr = dateRange.end.toString();

        const response = await financeiroService.getDashboardResumo(startStr, endStr);
        setDados(response);
      } catch (error) {
        console.error("Erro ao carregar os dados do dashboard", error);
      } finally {
        setIsLoading(false);
      }
    };

    carregarDashboard();
  }, [dateRange]); // <-- Dispara de novo sempre que o usuário mudar a data

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  // Se estiver carregando PELA PRIMEIRA VEZ, mostra o spinner na tela toda
  if (isLoading && !dados) {
    return (
      <div className="flex h-full w-full items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }



  const CustomTooltip = ({ active, payload, label }: any) => { // ✪ CustomTooltip
    if (active && payload && payload.length) {
      // Faz o somatório das fatias empilhadas (Consulta + Terapia, etc)
      const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);

      return (
        <div className="bg-background border border-border p-3 rounded-lg shadow-xl">
          {/* Label agora recebe a data completa (DD/MM/YYYY) do backend */}
          <p className="font-semibold text-foreground mb-3">{label}</p>

          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6 text-sm mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-muted-foreground">{entry.name}:</span>
              </div>
              <span className="font-medium text-foreground">{formatarMoeda(entry.value)}</span>
            </div>
          ))}

          <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-sm font-bold text-foreground">
            <span>Total do Dia:</span>
            <span>{formatarMoeda(total)}</span>
          </div>
        </div>
      );
    }
    return null;
  };


  const kpis = dados?.kpis || {};
  const receitaData = dados?.graficos?.receita_por_categoria || [];
  const metodosData = dados?.graficos?.metodos_pagamento || [];
  const topProfissionais = dados?.rankings?.top_profissionais || [];

  const faturamentoDiario = dados?.graficos?.faturamento_diario || [];
  const categoriasPeriodo = dados?.graficos?.categorias_periodo || [];

  // Dicionário de cores sólidas e contrastantes
  const CATEGORIA_COLORS: Record<string, string> = {
    'CONSULTA': 'hsl(var(--primary))', // PRETO padrão do seu tema
    'TERAPIA': '#47346a',              // ROXO
    'EXAME': '#059669',                // VERDE (Emerald 600)
    'Outros': '#f59e0b'                // Laranja caso caia algo fora do padrão
  };

  const METODO_COLORS: Record<string, string> = {
    'PIX': '#10b981',        // Verde esmeralda
    'DINHEIRO': '#22c55e',   // Verde clássico
    'CREDITO': '#8b5cf6',    // Roxo
    'DEBITO': '#3b82f6',     // Azul
    'CONVENIO': '#f43f5e',   // Rosa/Vermelho
    'CORTESIA': '#f59e0b',   // Dourado/Âmbar (Combina com o ícone Gift)
    'Outros': '#94a3b8'      // Cinza neutro
  };


  // const PIE_COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#ef4444', '#47346a'];


  return ( // ── ⋙────── DOM ──────────➤
    <div className="flex-1 space-y-6 p-2 md:p-8 pt-6">

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0 pb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Acompanhe a saúde financeira da clínica.</p>
        </div>

        {/* DatePicker Injetado Aqui */}
        <div className="flex items-center space-x-2">
          <SmartDateRangePicker
            value={dateRange}
            onChange={setDateRange}
          />
        </div>
      </div>

      {/* Se estiver recarregando devido a troca de data, coloca uma opacidade na tela */}
      <div className={isLoading ? "opacity-50 pointer-events-none transition-opacity duration-200" : "transition-opacity duration-200"}>


        {/* Grid de KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">


          <Card // HERE Faturamento Bruto
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturamento Bruto</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="overflow-hidden">
              {/* truncate adiciona os '...' se bater na borda. title mostra o valor completo no hover */}
              <div className="text-2xl font-bold truncate" title={formatarMoeda(kpis.faturamento_total || 0)}>
                {formatarMoeda(kpis.faturamento_total || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">No período selecionado</p>
            </CardContent>
          </Card>


          <Card // HERE KPI Atendimentos
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atendimentos</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.total_atendimentos || 0}</div>

              <div className="flex flex-col gap-1 mt-1.5 text-[11px] font-medium">

                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center"><Stethoscope className="mr-1 h-3 w-3" /> Consultas:</span>
                  <span className="text-foreground">{kpis.atendimentos_consulta || 0}</span>
                </div>

                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center"><Armchair className="mr-1 h-3 w-3" /> Terapias:</span>
                  <span className="text-foreground">{kpis.atendimentos_terapia || 0}</span>
                </div>


                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center"><Microscope className="mr-1 h-3 w-3" /> Exames:</span>
                  <span className="text-foreground">{kpis.atendimentos_exame || 0}</span>
                </div>

              </div>
            </CardContent>
          </Card>


          <Card // HERE KPI Ticket Médio
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio Geral</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="overflow-hidden">
              <div className="text-2xl font-bold truncate" title={formatarMoeda(kpis.ticket_medio || 0)}>
                {formatarMoeda(kpis.ticket_medio || 0)}
              </div>

              <div className="flex flex-col gap-1 mt-1.5 text-[11px] font-medium">

                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center"><Stethoscope className="mr-1 h-3 w-3" /> Consultas:</span>
                  <span className="text-foreground">{formatarMoeda(kpis.ticket_medio_consulta || 0)}</span>
                </div>

                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center"><Armchair className="mr-1 h-3 w-3" /> Terapias:</span>
                  <span className="text-foreground">{formatarMoeda(kpis.ticket_medio_terapia || 0)}</span>
                </div>

                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center"><Microscope className="mr-1 h-3 w-3" /> Exames:</span>
                  <span className="text-foreground">{formatarMoeda(kpis.ticket_medio_exame || 0)}</span>
                </div>


              </div>
            </CardContent>
          </Card>


          <Card // HERE KPI Pacientes Únicos
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pacientes Únicos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.pacientes_unicos || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">No período selecionado</p>
            </CardContent>
          </Card>
        </div>




        <div // . . . . . . . . . . . . . . .  L2
          className="grid gap-4 grid-cols-1 mb-4">
          <Card // HERE Faturamento Diário
            className="min-w-0">
            <CardHeader>
              <CardTitle>Faturamento Diário</CardTitle>
              <CardDescription>Evolução das entradas no período selecionado</CardDescription>
            </CardHeader>
            <CardContent className="pl-0">


              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={faturamentoDiario} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="data"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => value.substring(0, 5)}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${value}`} />

                  {/* Tooltip agora mostra o nome do médico em vez de "Faturamento" */}

                  <RechartsTooltip // ○ CustomTooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                  />

                  {/* Legenda no topo para sabermos qual cor é qual profissional */}
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />


                  {/* Iteramos sobre os profissionais para criar as fatias empilhadas */}
                  {categoriasPeriodo.map((categoria: string) => (
                    <Bar
                      key={categoria}
                      dataKey={categoria}
                      stackId="a"
                      fill={CATEGORIA_COLORS[categoria] || CATEGORIA_COLORS['Outros']}
                      radius={[0, 0, 0, 0]}
                    />
                  ))}

                  <Brush
                    dataKey="data"
                    height={30}
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--background))"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>


        <div // . . . . . . . . . . . . . . .  L3
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">


          <Card // HERE  Por Categoria
            className="min-w-0">
            <CardHeader>
              <CardTitle>Por Categoria</CardTitle>
              <CardDescription>Consultas & Terapias</CardDescription>
            </CardHeader>
            {/* Removemos o pl-0 e colocamos pb-4 para não colar embaixo */}
            <CardContent className="pb-4 pr-4">
              <ResponsiveContainer width="100%" height={300}>
                {/* Aumentamos a margem 'left' de -20 para 10 para dar espaço ao "R$" */}
                <BarChart data={receitaData} margin={{ top: 12, right: 6, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="categoria" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${value}`} />
                  <RechartsTooltip cursor={{ fill: 'hsl(var(--muted)/0.5)' }} formatter={(value: number) => [formatarMoeda(value), "Faturamento"]} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))' }} />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                    {receitaData.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CATEGORIA_COLORS[entry.categoria] || CATEGORIA_COLORS['Outros']}
                      />
                    ))}
                  </Bar>                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>



          <Card // HERE  Métodos de Pagamento
            className="min-w-0">
            <CardHeader>
              <CardTitle>Métodos de Pagamento</CardTitle>
              <CardDescription>Distribuição das entradas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={metodosData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="total"
                    nameKey="metodo"
                  >

                    {metodosData.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={METODO_COLORS[entry.metodo] || METODO_COLORS['Outros']}
                      />
                    ))}


                  </Pie>
                  <RechartsTooltip formatter={(value: number) => formatarMoeda(value)} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>


          <Card // HERE  Rank Profissionais
            className="min-w-0 flex flex-col">
            <CardHeader>
              <CardTitle>Por Profissionais</CardTitle>
              <CardDescription>Faturamento por profissional no período</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto max-h-75 pr-6 pb-6">
              {/* Aumentamos o espaçamento vertical entre os profissionais (space-y-5) */}
              <div className="space-y-5">
                {topProfissionais.map((prof: any, index: number) => (
                  // Mudamos de items-center para items-start
                  <div key={index} className="flex items-start">

                    {/* Adicionamos shrink-0 e um mt-0.5 para o avatar não ser esmagado e alinhar perfeitamente com o Nome */}
                    <Avatar className="h-8 w-8 shrink-0 border flex items-center justify-center font-bold text-xs shadow-sm bg-muted/50 mt-0.5">
                      {index === 0 && <span className="text-yellow-500">1º</span>}
                      {index === 1 && <span className="text-gray-400">2º</span>}
                      {index === 2 && <span className="text-amber-600">3º</span>}
                      {index > 2 && <span className="text-muted-foreground">{index + 1}º</span>}
                    </Avatar>

                    {/* Empilhamento em coluna limpo e organizado */}
                    <div className="ml-3 flex flex-col space-y-1.5 overflow-hidden">
                      <p className="text-sm font-medium leading-none truncate" title={prof.nome}>
                        {prof.nome}
                      </p>
                      <div className="font-semibold text-sm text-foreground">
                        {formatarMoeda(prof.faturamento)}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-none">
                        {prof.atendimentos} {prof.atendimentos === 1 ? 'atendimento' : 'atendimentos'}
                      </p>
                    </div>

                  </div>
                ))}

                {topProfissionais.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground pt-4">
                    Nenhum atendimento no período.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

        </div>


      </div>
    </div>
  );
}