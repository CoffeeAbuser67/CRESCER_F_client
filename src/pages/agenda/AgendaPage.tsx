/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer, Views, View, Navigate } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, endOfWeek, addDays } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// IMPORT ADDED: ChevronLeft, ChevronRight for the new toolbar
import { X, Clock, User, Stethoscope, Brain, ClipboardList, Layers, ChevronLeft, ChevronRight } from "lucide-react";

// @ts-expect-error - The library does not provide typings for the CSS files
import "react-big-calendar/lib/css/react-big-calendar.css";
// @ts-expect-error - Drag and drop specific CSS
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";



import { agendaService } from "@/services/agendaService";
import { financeiroService } from "@/services/financeiroService";
import { toast } from "react-toastify";


// # ── ⋙──────────────────────────────────────────────➤

const locales = { "pt-BR": ptBR };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });
const DnDCalendar = withDragAndDrop(Calendar);

// --- CUSTOM COMPONENTS ---

const CustomEvent = ({ event }: any) => {
  let EventIcon = Stethoscope;
  if (event.type === "terapia") EventIcon = Brain;
  if (event.type === "exame") EventIcon = ClipboardList;
  if (event.type === "consulta") EventIcon = Stethoscope;

  return (
    <div className="flex flex-col justify-start h-full w-full overflow-hidden p-0.5">
      <div className="flex items-center gap-1 w-full pointer-events-none">
        <EventIcon className="h-3 w-3 flex-shrink-0" />
        <span className="text-xs font-semibold leading-tight truncate">
          {event.title}
        </span>
      </div>
    </div>
  );
};

// --- NEW: CUSTOM TOOLBAR (SHADCN STYLE) ---
const CustomToolbar = (toolbar: any) => {

  const goToBack = () => toolbar.onNavigate(Navigate.PREVIOUS);
  const goToNext = () => toolbar.onNavigate(Navigate.NEXT);
  const goToCurrent = () => toolbar.onNavigate(Navigate.TODAY);

  const viewLabels: Record<string, string> = {
    month: "Mês",
    week: "Semana",
    day: "Dia",
    agenda: "Lista",
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
      {/* Left: Navigation Controls */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={goToCurrent} className="h-8 text-xs bg-white">
          Hoje
        </Button>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={goToBack} className="h-8 w-8 bg-white">
            <ChevronLeft className="h-4 w-4 text-slate-600" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNext} className="h-8 w-8 bg-white">
            <ChevronRight className="h-4 w-4 text-slate-600" />
          </Button>
        </div>
      </div>

      {/* Center: Current Date Label */}
      <h2 className="text-lg font-semibold text-slate-800 capitalize">
        {toolbar.label}
      </h2>

      {/* Right: View Switchers (Styled like Shadcn Tabs) */}
      <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
        {toolbar.views.map((viewName: string) => (
          <button
            key={viewName}
            onClick={() => toolbar.onView(viewName)}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${toolbar.view === viewName
              ? "bg-white text-slate-900 shadow-sm border border-slate-200/50"
              : "text-slate-500 hover:text-slate-700"
              }`}
          >
            {viewLabels[viewName] || viewName}
          </button>
        ))}
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function AgendaPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [openSessions, setOpenSessions] = useState<any[]>([]);

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [currentView, setCurrentView] = useState<View>(() => window.innerWidth < 768 ? Views.AGENDA : Views.WEEK);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [popover, setPopover] = useState<{ visible: boolean; x: number; y: number }>({ visible: false, x: 0, y: 0 });
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const [conflictAlert, setConflictAlert] = useState<{
    isOpen: boolean;
    professional: string;
    onConfirm: () => void;
  }>({ isOpen: false, professional: "", onConfirm: () => { } });

  const [filterProfessional, setFilterProfessional] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");

  const uniqueProfessionals = Array.from(new Set([
    ...events.map(e => e.professional),
    ...openSessions.map(s => s.professional)
  ])).filter(Boolean);

  const availableSessions = openSessions.filter(
    (session) => session?.patientId?.toString() === selectedPatientId
  );

  // 4. Fetch initial Data (Patients)
  useEffect(() => {
    financeiroService.getPacientes().then(setPatients).catch(console.error);
  }, []);





  useEffect(() => {
    const fetchAgendaData = async () => {
      try {
        let start, end;

        if (currentView === Views.DAY) {
          start = currentDate;
          end = currentDate;
        } else if (currentView === Views.AGENDA) {
          start = currentDate;
          end = addDays(currentDate, 30); // AGORA SIM! Busca os 30 dias da legenda
        } else if (currentView === Views.WEEK) {
          start = startOfWeek(currentDate, { weekStartsOn: 0 });
          end = endOfWeek(currentDate, { weekStartsOn: 0 });
        } else {
          start = startOfMonth(currentDate);
          end = endOfMonth(currentDate);
        }



        const startStr = format(start, "yyyy-MM-dd");
        const endStr = format(end, "yyyy-MM-dd");

        const [eventsData, sessionsData] = await Promise.all([
          agendaService.getScheduledEvents(startStr, endStr),
          agendaService.getOpenSessions()
        ]);

        setEvents(eventsData);
        setOpenSessions(sessionsData);
      } catch (error) {
        console.error("Error loading agenda data:", error);
        toast.error("Erro ao carregar dados da agenda");
      }
    };

    fetchAgendaData();
  }, [currentDate, currentView, refreshTrigger]);



  const closePopover = () => {
    setPopover({ visible: false, x: 0, y: 0 });
    setSelectedSlot(null);
    setSelectedEvent(null);
    setSelectedPatientId("");
    setSelectedSessionId("");
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      if (mobile !== isMobile) {
        setIsMobile(mobile);
        setCurrentView(mobile ? Views.AGENDA : Views.WEEK);
      }
      closePopover();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobile]);

  const handleSelectSlot = (slotInfo: any) => {
    setSelectedSlot({ start: slotInfo.start, end: slotInfo.end });
    setSelectedEvent(null);

    const isMonthView = currentView === Views.MONTH;
    setStartTime(isMonthView ? "08:00" : format(slotInfo.start, "HH:mm"));
    setEndTime(isMonthView ? "09:00" : format(slotInfo.end, "HH:mm"));

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;

    if (slotInfo.bounds) {
      x = slotInfo.bounds.right + 16;
      y = slotInfo.bounds.top;
    } else if (slotInfo.box) {
      x = slotInfo.box.clientX + 16;
      y = slotInfo.box.clientY;
    }

    const popoverWidth = 320;
    const popoverHeight = 350;
    if (x + popoverWidth > window.innerWidth) x = window.innerWidth - popoverWidth - 20;
    if (y + popoverHeight > window.innerHeight) y = window.innerHeight - popoverHeight - 20;

    setPopover({ visible: true, x, y });
  };

  const handleSelectEvent = (event: any, e: any) => {
    setSelectedEvent(event);
    setSelectedSlot(null);

    let x = e.clientX + 16;
    let y = e.clientY;

    const popoverWidth = 320;
    const popoverHeight = 350;
    if (x + popoverWidth > window.innerWidth) x = window.innerWidth - popoverWidth - 20;
    if (y + popoverHeight > window.innerHeight) y = window.innerHeight - popoverHeight - 20;

    setPopover({ visible: true, x, y });
  };

  const handleSaveAllocation = async () => {
    if (!selectedSlot || !selectedPatientId || !selectedSessionId) return;

    const patient = patients.find(p => p.id.toString() === selectedPatientId);
    const sessionToAllocate = openSessions.find(s => s.id.toString() === selectedSessionId);

    if (!patient || !sessionToAllocate) return;

    const finalStart = new Date(selectedSlot.start);
    finalStart.setHours(Number(startTime.split(':')[0]), Number(startTime.split(':')[1]), 0, 0);

    const finalEnd = new Date(selectedSlot.start);
    finalEnd.setHours(Number(endTime.split(':')[0]), Number(endTime.split(':')[1]), 0, 0);

    // Call API First
    try {
      await agendaService.updateSessionTime(selectedSessionId, {
        data_competencia: format(finalStart, "yyyy-MM-dd"),
        hora_inicio: startTime,
        hora_fim: endTime,
      });
      toast.success("Sessão alocada com sucesso!");
      setRefreshTrigger((prev) => prev + 1);
      closePopover();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao alocar sessão.");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedEvent) return;
    try {
      await agendaService.updateSessionStatus(selectedEvent.id, newStatus);
      // Optimistic update for immediate UI feedback
      setEvents((prev) => prev.map((e) => e.id === selectedEvent.id ? { ...e, status: newStatus } : e));
      setSelectedEvent({ ...selectedEvent, status: newStatus });
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar status.");
    }
  };

  const handleUnschedule = async () => {
    if (!selectedEvent) return;
    try {
      await agendaService.unscheduleSession(selectedEvent.id);
      toast.success("Sessão removida da agenda.");
      setRefreshTrigger((prev) => prev + 1);
      closePopover();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao desagendar sessão.");
    }
  };

  const handleEventDrop = async ({ event, start, end }: any) => {
    try {
      await agendaService.updateSessionTime(event.id, {
        data_competencia: format(start, "yyyy-MM-dd"),
        hora_inicio: format(start, "HH:mm"),
        hora_fim: format(end, "HH:mm")
      });
      // Optimistic update
      setEvents((prevEvents) => prevEvents.map((e) => (e.id === event.id ? { ...e, start, end } : e)));
    } catch (error) {
      console.error(error);
      toast.error("Erro ao mover a sessão.");
      setRefreshTrigger((prev) => prev + 1);
    }
  };

  const handleEventResize = async ({ event, start, end }: any) => {
    try {
      await agendaService.updateSessionTime(event.id, {
        data_competencia: format(start, "yyyy-MM-dd"),
        hora_inicio: format(start, "HH:mm"),
        hora_fim: format(end, "HH:mm")
      });
      // Optimistic update
      setEvents((prevEvents) => prevEvents.map((e) => (e.id === event.id ? { ...e, start, end } : e)));
    } catch (error) {
      console.error(error);
      toast.error("Erro ao redimensionar a sessão.");
      setRefreshTrigger((prev) => prev + 1);
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchProfessional = filterProfessional === "ALL" || event.professional === filterProfessional;
    const matchStatus = filterStatus === "ALL" || event.status === filterStatus;
    const matchType = filterType === "ALL" || event.type === filterType;
    return matchProfessional && matchStatus && matchType;
  });

  const displayEvents = selectedSlot
    ? [...filteredEvents, { id: "draft", title: "Alocando...", start: selectedSlot.start, end: selectedSlot.end, isDraft: true }]
    : filteredEvents;

  const eventStyleGetter = (event: any) => {
    if (event.isDraft) {
      return {
        style: {
          backgroundColor: "rgba(59, 130, 246, 0.15)",
          border: "2px dashed #3b82f6",
          color: "#1e3a8a",
          boxShadow: "none",
          pointerEvents: "none" as any,
        }
      };
    }

    let bgColor = "#64748b";
    if (event.status === "REALIZADO") bgColor = "#10b981";
    if (event.status === "FALTA") bgColor = "#f59e0b";
    if (event.status === "CANCELADO") bgColor = "#ef4444";

    return {
      style: { backgroundColor: bgColor, border: "none", color: "white" }
    };
  };

  const availableViews = isMobile ? [Views.DAY, Views.AGENDA] : [Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA];

  return (
    <div className="w-full p-4 md:p-8 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Agenda</h1>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={filterProfessional} onValueChange={setFilterProfessional}>
            <SelectTrigger className="w-[200px] h-9 bg-white border-slate-200">
              <SelectValue placeholder="Todos os Profissionais" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os Profissionais</SelectItem>
              {uniqueProfessionals.map((prof) => (
                <SelectItem key={prof as string} value={prof as string}>{prof as string}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px] h-9 bg-white border-slate-200">
              <SelectValue placeholder="Todos os Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os Status</SelectItem>
              <SelectItem value="PENDENTE">Pendente</SelectItem>
              <SelectItem value="REALIZADO">Realizado</SelectItem>
              <SelectItem value="FALTA">Faltou</SelectItem>
              <SelectItem value="CANCELADO">Cancelado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[160px] h-9 bg-white border-slate-200">
              <SelectValue placeholder="Todos os Tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os Tipos</SelectItem>
              <SelectItem value="terapia">Terapia</SelectItem>
              <SelectItem value="consulta">Consulta</SelectItem>
              <SelectItem value="exame">Exame</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="w-full bg-white p-2 md:p-4 rounded-xl border border-slate-200 shadow-sm" style={{ height: "calc(100vh - 140px)", minHeight: "600px" }}>
        <DnDCalendar
          localizer={localizer}
          formats={{
            dayHeaderFormat: "EEEE dd/MMM",
          }}
          events={displayEvents}
          startAccessor={(event: any) => new Date(event.start)}
          endAccessor={(event: any) => new Date(event.end)}
          culture="pt-BR"
          views={availableViews}
          view={currentView}
          onView={setCurrentView}
          date={currentDate}
          onNavigate={setCurrentDate}
          selectable={true}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          draggableAccessor={() => true}
          resizable={true}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          components={{
            event: CustomEvent,
            toolbar: CustomToolbar
          }}

          eventPropGetter={eventStyleGetter}
          messages={{ next: "Próximo", previous: "Anterior", today: "Hoje", month: "Mês", week: "Semana", day: "Dia", agenda: "Agenda", date: "Data", time: "Hora", event: "Sessão", noEventsInRange: "Nenhuma sessão agendada.", showMore: (total) => `+${total} mais` }}
          className="font-sans text-slate-700"
        />
      </div>

      {popover.visible && (
        <>
          <div className="fixed inset-0 z-40 bg-transparent" onClick={closePopover} />
          <div className="fixed z-50 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200" style={{ left: popover.x, top: popover.y }}>

            {selectedSlot && (
              <>
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-semibold text-slate-700 text-sm">Alocar Sessão</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600" onClick={closePopover}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="p-4 space-y-4">
                  <div className="flex flex-col gap-2 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <p className="font-medium">{format(selectedSlot.start, "dd/MM/yyyy")}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-8 text-sm w-24 bg-white" />
                      <span className="text-xs text-slate-500 font-medium">até</span>
                      <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-8 text-sm w-24 bg-white" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-500 flex items-center gap-1"><User className="h-3 w-3" /> Paciente</Label>
                      <Select value={selectedPatientId} onValueChange={(val) => { setSelectedPatientId(val); setSelectedSessionId(""); }}>
                        <SelectTrigger className="h-9 bg-white border-slate-200">
                          <SelectValue placeholder="Selecione um paciente..." />
                        </SelectTrigger>
                        <SelectContent>
                          {patients.map((p) => (
                            <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-500 flex items-center gap-1"><Layers className="h-3 w-3" /> Sessão Disponível</Label>
                      <Select value={selectedSessionId} onValueChange={setSelectedSessionId} disabled={!selectedPatientId || availableSessions.length === 0}>
                        <SelectTrigger className="h-9 bg-white border-slate-200">
                          <SelectValue placeholder={!selectedPatientId ? "Selecione o paciente" : availableSessions.length === 0 ? "Nenhum crédito" : "Selecione a sessão..."} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSessions.map((session) => (
                            <SelectItem key={session.id} value={session.id.toString()}>
                              {session.title} - {session.professional}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={closePopover} className="text-xs">Cancelar</Button>
                  <Button size="sm" onClick={handleSaveAllocation} disabled={!selectedSessionId} className="bg-blue-600 hover:bg-blue-700 text-white text-xs disabled:opacity-50">Confirmar</Button>
                </div>
              </>
            )}

            {selectedEvent && (
              <>
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-semibold text-slate-700 text-sm truncate pr-2" title={selectedEvent.title}>
                    {selectedEvent.title}
                  </span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600 flex-shrink-0" onClick={closePopover}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="p-4 space-y-4">
                  <div className="flex flex-col gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span className="font-medium">{format(selectedEvent.start, "dd/MM/yyyy")}</span>
                      <span>•</span>
                      <span>{format(selectedEvent.start, "HH:mm")} às {format(selectedEvent.end, "HH:mm")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-slate-400" />
                      <span className="capitalize">Tipo: {selectedEvent.type}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500 font-semibold">Status da Sessão</Label>
                    <Select value={selectedEvent.status} onValueChange={handleStatusChange}>
                      <SelectTrigger className="h-9 bg-white border-slate-200">
                        <SelectValue placeholder="Status da Sessão" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDENTE">Pendente (Cinza)</SelectItem>
                        <SelectItem value="REALIZADO">Realizado (Verde)</SelectItem>
                        <SelectItem value="FALTA">Faltou (Laranja)</SelectItem>
                        <SelectItem value="CANCELADO">Cancelado (Vermelho)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-between gap-2">
                  <Button variant="outline" size="sm" onClick={handleUnschedule} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 text-xs">
                    Desagendar
                  </Button>
                  <Button size="sm" onClick={closePopover} className="bg-slate-900 hover:bg-slate-800 text-white text-xs">
                    Fechar
                  </Button>
                </div>
              </>
            )}

          </div>
        </>
      )}

      <AlertDialog open={conflictAlert.isOpen} onOpenChange={(open) => !open && setConflictAlert(prev => ({ ...prev, isOpen: false }))}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-800">Aviso de Choque de Horários</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 text-base">
              Atenção: <strong className="text-slate-900">{conflictAlert.professional}</strong> já possui uma sessão agendada que conflita com este horário.
              <br /><br />
              Deseja forçar este encaixe mesmo assim?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={conflictAlert.onConfirm} className="bg-red-600 hover:bg-red-700 text-white">
              Forçar Encaixe
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}