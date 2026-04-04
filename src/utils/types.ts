
export interface User {
  id: number;
  username: string;
  email: string;
  is_active?: boolean;
  role: 'ADMIN' | 'COMUM';
}

export interface LoginCredentials {
  username: string; 
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export type CategoriaServico = 'CONSULTA' | 'TERAPIA' | 'EXAME';
export type MetodoPagamento = 'PIX' | 'DINHEIRO' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'CONVENIO' ;

export interface Especialidade {
  id: string;
  nome: string;
}

export interface Profissional {
  id: string; // UUID
  nome: string;
  ativo: boolean;
  especialidades: Especialidade[];
}

export interface Servico {
  id: string; // UUID
  nome: string;
  categoria: CategoriaServico;
}

export interface Paciente {
  id: string; // UUID
  nome: string;
  telefone?: string;
}


export type StatusVenda = 'ATIVA' | 'FINALIZADA' | 'CANCELADA' | 'PARCIALMENTE_CANCELADA';
export type StatusAgendamento = 'PENDENTE' | 'REALIZADO' | 'CANCELADO' | 'FALTA';
export type StatusParcela = 'PENDENTE' | 'PAGO' | 'CANCELADO' | 'INADIMPLENTE';



// 1. Parcela (The Caixa)
export interface ParcelaCreate {
  valor_parcela: number;
  data_vencimento: string; // YYYY-MM-DD
  data_pagamento?: string | null;
  metodo_pagamento?: MetodoPagamento | null;
  status?: StatusParcela;
}

export interface Parcela extends ParcelaCreate {
  id: string;
  venda_id: string;
}

// 2. Agendamento (The Suor)
export interface AgendamentoCreate {
  data_competencia?: string | null; // YYYY-MM-DD
  status?: StatusAgendamento;
  servico_id: string;
  profissional_id: string;
}

export interface Agendamento extends AgendamentoCreate {
  id: string;
  venda_id: string;
  // Included directly in the response
  servico: { id: string; nome: string; categoria: string };
  profissional: { id: string; nome: string; ativo: boolean };
}

// 3. Venda (The Contract / Parent)
export interface VendaCreate {
  data_venda: string; // YYYY-MM-DD
  valor_total: number;
  status?: StatusVenda;
  observacao?: string;
  
  paciente_id?: string | null;
  paciente_nome?: string | null; // On-the-fly
  
  // The Wizard nested payload
  agendamentos: AgendamentoCreate[];
  parcelas: ParcelaCreate[];
}

export interface Venda {
  id: string;
  data_venda: string;
  valor_total: number;
  status: StatusVenda;
  observacao?: string;
  paciente: Paciente;
  
  agendamentos: Agendamento[];
  parcelas: Parcela[];
}