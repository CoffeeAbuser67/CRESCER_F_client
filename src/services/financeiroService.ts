import { api } from "../lib/api";
import type {
  Lancamento,
  CreateLancamentoDTO,
  Profissional,
  Servico,
  Paciente,
} from "../utils/types";

export const financeiroService = {
  getLancamentos: async (
    startDate: string,
    endDate: string,
    skip = 0,
    limit = 50,
  ): Promise<Lancamento[]> => {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      skip: skip.toString(),
      limit: limit.toString(),
    });

    const { data } = await api.get(
      `/financeiro/lancamentos?${params.toString()}`,
    );
    return data;
  },

  deleteLancamento: async (id: string): Promise<void> => {
    await api.delete(`/financeiro/lancamentos/${id}`);
  },

  createLancamento: async (payload: CreateLancamentoDTO) => {
    const { data } = await api.post<Lancamento>(
      "/financeiro/lancamentos",
      payload,
    );
    return data;
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
};
