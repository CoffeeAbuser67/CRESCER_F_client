/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from "../lib/api";

// --- INTERFACES ---
export interface AgendaEvent {
  id: string | number;
  title: string;
  professional: string;
  start: Date;
  end: Date;
  status: string;
  type: string;
}

export interface OpenSession {
  id: string | number;
  patientId: string | number;
  title: string;
  professional: string;
  type: string;
}

export interface AllocatePayload {
  data_competencia: string; // Format: YYYY-MM-DD
  hora_inicio: string; // Format: HH:mm
  hora_fim: string; // Format: HH:mm
}

export const agendaService = {
  // 1. Fetch scheduled sessions for the calendar
  getScheduledEvents: async (
    startDate: string,
    endDate: string,
  ): Promise<AgendaEvent[]> => {
    const response = await api.get("/agenda/agendamentos", {
      params: { start: startDate, end: endDate },
    });

    return response.data.map((item: any) => ({
      id: item.id,
      title: `${item.venda.paciente.nome} (${item.profissional.nome})`,
      professional: item.profissional.nome,
      start: new Date(`${item.data_competencia}T${item.hora_inicio}`),
      end: new Date(`${item.data_competencia}T${item.hora_fim}`),
      status: item.status,
      type: item.servico.categoria.toLowerCase(),
    }));
  },

  // 2. Fetch sessions that are paid/active but NOT scheduled yet (Open credits)
  getOpenSessions: async (): Promise<OpenSession[]> => {
    // Expected to return sessions where data_competencia is NULL
    const response = await api.get("/agenda/agendamentos/abertos");

    return response.data.map((item: any) => ({
      id: item.id,
      patientId: item.venda.paciente.id,
      title: item.servico.nome,
      professional: item.profissional.nome,
      type: item.servico.categoria.toLowerCase(),
    }));
  },

  // 3. Allocate, Drag & Drop, or Resize a session
  updateSessionTime: async (
    sessionId: string | number,
    payload: AllocatePayload,
  ): Promise<any> => {
    const response = await api.patch(
      `/agenda/agendamentos/${sessionId}/horario`,
      payload,
    );
    return response.data;
  },

  // 4. Update ONLY the status (PENDENTE, REALIZADO, FALTA, CANCELADO)
  updateSessionStatus: async (
    sessionId: string | number,
    status: string,
  ): Promise<any> => {
    const response = await api.patch(
      `/agenda/agendamentos/${sessionId}/status`,
      { status },
    );
    return response.data;
  },

  // 5. Unschedule (Remove from calendar, return to open sessions)
  unscheduleSession: async (sessionId: string | number): Promise<any> => {
    // Sends null to date and time fields to clear them
    const response = await api.patch(
      `/agenda/agendamentos/${sessionId}/horario`,
      {
        data_competencia: null,
        hora_inicio: null,
        hora_fim: null,
        status: "PENDENTE", // Reset status when unscheduling
      },
    );
    return response.data;
  },
};
