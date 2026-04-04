import { api } from "../lib/api";
import type {
  Profissional,
  Servico,
  Paciente,
  Venda,
  VendaCreate,
  MetodoPagamento,
  StatusAgendamento,
} from "../utils/types";

export const financeiroService = {
  createVenda: async (payload: VendaCreate): Promise<Venda> => {
    const { data } = await api.post<Venda>("/financeiro/vendas", payload);
    return data;
  },

  getVendas: async (skip = 0, limit = 100): Promise<Venda[]> => {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });
    const { data } = await api.get<Venda[]>(
      `/financeiro/vendas?${params.toString()}`,
    );
    return data;
  },

  darBaixaParcela: async (
    id: string,
    payload: { data_pagamento: string; metodo_pagamento: MetodoPagamento },
  ): Promise<void> => {
    await api.patch(`/financeiro/parcelas/${id}/pagar`, payload);
  },

  atualizarStatusAgendamento: async (
    id: string,
    payload: { status: StatusAgendamento },
  ): Promise<void> => {
    await api.patch(`/financeiro/agendamentos/${id}/status`, payload);
  },

  createProfissional: async (payload: {
    nome: string;
  }): Promise<Profissional> => {
    const { data } = await api.post<Profissional>(
      "/financeiro/profissionais",
      payload,
    );
    return data;
  },

  getPacientes: async () => {
    const { data } = await api.get<Paciente[]>("/financeiro/pacientes");
    return data;
  },

  getProfissionais: async () => {
    const { data } = await api.get<Profissional[]>("/financeiro/profissionais");
    return data;
  },

  getServicos: async () => {
    const { data } = await api.get<Servico[]>("/financeiro/servicos");
    return data;
  },

  getTodosProfissionais: async (): Promise<Profissional[]> => {
    const response = await api.get("/financeiro/admin/profissionais");
    return response.data;
  },

  toggleProfissionalStatus: async (id: string): Promise<void> => {
    await api.patch(`/financeiro/admin/profissionais/${id}/toggle-status`);
  },

  createServico: async (payload: {
    nome: string;
    categoria: string;
  }): Promise<Servico> => {
    const { data } = await api.post<Servico>("/financeiro/servicos", payload);
    return data;
  },

  deleteServico: async (id: string): Promise<void> => {
    await api.delete(`/financeiro/servicos/${id}`);
  },

  // getDashboardResumo: async (
  //   startDate: string,
  //   endDate: string,
  // ): Promise<any> => {
  //   const { data } = await api.get("/financeiro/dashboard/resumo", {
  //     params: { start_date: startDate, end_date: endDate },
  //   });
  //   return data;
  // },
};
