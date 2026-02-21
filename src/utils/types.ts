
export interface User {
  id: number;
  username: string;
  email: string;
  is_active?: boolean;
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



export type TipoLancamento = 'CONSULTA' | 'TERAPIA';
export type MetodoPagamento = 'PIX' | 'DINHEIRO' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' ;

export interface Profissional {
  id: string; // UUID
  nome: string;
  especialidade?: string; 
  ativo: boolean;
}

export interface Servico {
  id: string; // UUID
  nome: string;
  categoria: TipoLancamento;
}

export interface Paciente {
  id: string; // UUID
  nome: string;
  telefone?: string;
}

export interface Lancamento {
  id: string; // UUID
  data_pagamento: string; // YYYY-MM-DD
  data_competencia: string; // YYYY-MM-DD
  valor: number; // Vem como number do JSON, cuidado com decimais no JS
  metodo_pagamento: MetodoPagamento;
  observacao?: string;
  
  // Relacionamentos expandidos
  paciente: Paciente;
  servico: Servico;
  profissional?: Profissional; // Opcional (Terapia)
}

// Payload para criação (sem ID)
export interface CreateLancamentoDTO {
  data_pagamento: string;
  data_competencia: string;
  valor: number;
  metodo_pagamento: MetodoPagamento;
  observacao?: string;
  servico_id: string;
  profissional_id?: string | null;
  paciente_id?: string | null;
  paciente_nome?: string | null; // On-the-fly
}