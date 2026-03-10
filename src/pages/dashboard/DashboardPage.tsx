import { useEffect, useState } from "react";
import { DollarSign, Users, Activity, TrendingUp, Loader2, Trophy } from "lucide-react";

// Imports Recharts
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, Brush
} from "recharts";



// Imports de Data (React Aria)
import { today, getLocalTimeZone } from '@internationalized/date';
import { SmartDateRangePicker } from "@/components/date-range-picker-aria";

import { financeiroService } from "@/services/financeiroService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function DashboardPage() {
  const [dados, setDados] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Estado do DatePicker: Padrão são os últimos 30 dias até hoje
  const [dateRange, setDateRange] = useState({
    start: today(getLocalTimeZone()).subtract({ days: 30 }),
    end: today(getLocalTimeZone())
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



  const kpis = dados?.kpis || {};
  const receitaData = dados?.graficos?.receita_por_categoria || [];
  const metodosData = dados?.graficos?.metodos_pagamento || [];
  const topProfissionais = dados?.rankings?.top_profissionais || [];

  const faturamentoDiario = dados?.graficos?.faturamento_diario || [];
  const categoriasPeriodo = dados?.graficos?.categorias_periodo || [];

  // Dicionário de cores sólidas e contrastantes
  const CATEGORIA_COLORS: Record<string, string> = {
    'CONSULTA': 'hsl(var(--primary))', // Azul/Roxo padrão do seu tema
    'TERAPIA': '#47346a',              // Verde esmeralda sólido
    'Outros': '#f59e0b'                // Laranja caso caia algo fora do padrão
  };

  const PIE_COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">

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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturamento Bruto</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatarMoeda(kpis.faturamento_total || 0)}</div>
              <p className="text-xs text-muted-foreground">No período selecionado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atendimentos</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.total_atendimentos || 0}</div>
              <p className="text-xs text-muted-foreground">No período selecionado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatarMoeda(kpis.ticket_medio || 0)}</div>
              <p className="text-xs text-muted-foreground">No período selecionado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pacientes Únicos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.pacientes_unicos || 0}</div>
              <p className="text-xs text-muted-foreground">No período selecionado</p>
            </CardContent>
          </Card>
        </div>



        {/* NOVA LINHA: Gráfico de Evolução Diária (Largura Total) */}
        <div className="grid gap-4 grid-cols-1 mb-4">
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Faturamento Diário</CardTitle>
              <CardDescription>Evolução das entradas no período selecionado</CardDescription>
            </CardHeader>
            <CardContent className="pl-0">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={faturamentoDiario} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="data" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${value}`} />

                  {/* Tooltip agora mostra o nome do médico em vez de "Faturamento" */}
                  <RechartsTooltip
                    cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                    formatter={(value: number, name: string) => [formatarMoeda(value), name]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))' }}
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

        {/* LINHA INFERIOR: 3 Colunas (Categoria, Métodos e Profissionais) */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

          {/* Coluna 1: Categoria */}
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Por Categoria</CardTitle>
              <CardDescription>Consultas vs Terapias</CardDescription>
            </CardHeader>
            <CardContent className="pl-0">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={receitaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="categoria" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${value}`} />
                  <RechartsTooltip cursor={{ fill: 'hsl(var(--muted)/0.5)' }} formatter={(value: number) => [formatarMoeda(value), "Faturamento"]} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))' }} />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Coluna 2: Métodos de Pagamento */}
          <Card className="min-w-0">
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
                    {metodosData.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => formatarMoeda(value)} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Coluna 3: Top Profissionais */}
          <Card className="min-w-0 flex flex-col">
            <CardHeader>
              <CardTitle>Top Profissionais</CardTitle>
              <CardDescription>Ranking de faturamento</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto max-h-[300px] pr-2">
              <div className="space-y-4">
                {topProfissionais.map((prof: any, index: number) => (
                  <div key={index} className="flex items-center">
                    <Avatar className="h-8 w-8 border flex items-center justify-center font-bold text-xs shadow-sm bg-muted/50">
                      {index === 0 && <span className="text-yellow-500">1º</span>}
                      {index === 1 && <span className="text-gray-400">2º</span>}
                      {index === 2 && <span className="text-amber-600">3º</span>}
                      {index > 2 && <span className="text-muted-foreground">{index + 1}º</span>}
                    </Avatar>
                    <div className="ml-3 space-y-0.5 overflow-hidden">
                      <p className="text-sm font-medium leading-none truncate" title={prof.nome}>{prof.nome}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {prof.atendimentos} atend.
                      </p>
                    </div>
                    <div className="ml-auto font-medium text-sm whitespace-nowrap">
                      {formatarMoeda(prof.faturamento)}
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