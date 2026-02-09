// src/services/financeiroService.ts
import {api} from '../lib/api'; // Sua instância configurada do Axios
import type { Lancamento, CreateLancamentoDTO, Profissional, Servico } from '../utils/types';

export const financeiroService = {
  getLancamentos: async (params?: { skip?: number; limit?: number }) => {
    // Futuramente adicionaremos filtros de data aqui: ?start=...&end=...
    const { data } = await api.get<Lancamento[]>('/financeiro/lancamentos', { params });
    return data;
  },

  createLancamento: async (payload: CreateLancamentoDTO) => {
    const { data } = await api.post<Lancamento>('/financeiro/lancamentos', payload);
    return data;
  },

  // Helpers para os Selects
  getProfissionais: async () => {
    const { data } = await api.get<Profissional[]>('/financeiro/profissionais');
    return data;
  },

  getServicos: async () => {
    const { data } = await api.get<Servico[]>('/financeiro/servicos');
    return data;
  }
};