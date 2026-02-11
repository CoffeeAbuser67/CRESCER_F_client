// src/services/financeiroService.ts
import { api } from "../lib/api"; // Sua instância configurada do Axios
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

  createLancamento: async (payload: CreateLancamentoDTO) => {
    const { data } = await api.post<Lancamento>(
      "/financeiro/lancamentos",
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
};
