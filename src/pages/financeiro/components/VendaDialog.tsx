/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { financeiroService } from "@/services/financeiroService";
import type { Servico, Profissional } from "@/utils/types";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Plus, Trash2, PlusCircle, CalendarPlus } from "lucide-react";
import { toast } from "react-toastify";
import { SmartDatePicker } from "@/components/date-picker-simple";

// --- ZOD SCHEMA (The Trinity) ---
const formSchema = z
  .object({
    // Parent Data
    data_venda: z.string().min(1, "Required").refine((date) => date <= todayStr, "Cannot be a future date"),
    valor_total: z.coerce.number().min(0, "O valor não pode ser negativo"),
    observacao: z.string().optional(),
    paciente_id: z.string().optional(),
    paciente_nome: z.string().optional(),

    // Core Business Logic: 1 Sale = 1 Service + 1 Professional
    servico_id: z.string().uuid("Selecione um serviço"),
    profissional_id: z.string().uuid("Selecione um profissional"),

    // Children: Parcelas (Caixa)
    parcelas: z
      .array(
        z.object({
          valor_parcela: z.coerce.number().min(0.01, "Valor inválido"),
          data_vencimento: z.string().min(1, "Required"), // Can be future
          data_pagamento: z.string().optional().refine((date) => !date || date <= todayStr, "Cannot be a future date"),
          metodo_pagamento: z.enum([
            "PIX",
            "DINHEIRO",
            "CREDITO",
            "DEBITO",
            "CONVENIO",
            "CORTESIA",
          ]).optional(),
        })
      )
      .min(1, "Adicione pelo menos uma parcela"),

    agendamentos: z
      .array(
        z.object({
          data_competencia: z.string().optional(),
          hora_inicio: z.string().optional(),
          hora_fim: z.string().optional(),
        }).refine(
          (data) => {
            // Só valida se os dois campos estiverem preenchidos
            if (data.hora_inicio && data.hora_fim) {
              return data.hora_inicio < data.hora_fim;
            }
            return true;
          },
          {
            message: "Fim deve ser maior que o início",
            path: ["hora_fim"], // O erro vai aparecer embaixinho do input de Hora Fim
          }
        )
      )
      .min(1, "Adicione pelo menos uma sessão"),
  })
  .refine((data) => data.paciente_nome && data.paciente_nome.trim().length > 0, {
    message: "Selecione ou digite um paciente",
    path: ["paciente_nome"],
  })
  .refine(
    (data) => {
      const totalParcelas = data.parcelas.reduce((acc, curr) => acc + curr.valor_parcela, 0);
      return Math.abs(totalParcelas - data.valor_total) < 0.02;
    },
    {
      message: "A soma das parcelas deve ser igual ao valor total da venda",
      path: ["valor_total"],
    }
  );

interface VendaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  categoriaFilter: string;
}

const todayStr = new Date().toISOString().split("T")[0];

export function VendaDialog({ open, onOpenChange, onSuccess, categoriaFilter }: VendaDialogProps) {
  const [pacientes, setPacientes] = useState<{ id: string; nome: string }[]>([]);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);

  const todayStr = new Date().toISOString().split("T")[0];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      data_venda: todayStr,
      valor_total: 0,
      observacao: "",
      paciente_nome: "",
      paciente_id: "",
      servico_id: "",
      profissional_id: "",
      parcelas: [
        {
          valor_parcela: 0,
          data_vencimento: todayStr,
          metodo_pagamento: "PIX",
          data_pagamento: "", // Critical fix: Starts empty
        },
      ],
      agendamentos: [
        {
          data_competencia: "",
          hora_inicio: "",
          hora_fim: "",
        },
      ],
    },
  });

  const {
    fields: parcelasFields,
    append: appendParcela,
    remove: removeParcela,
  } = useFieldArray({
    control: form.control,
    name: "parcelas",
  });

  const {
    fields: agendamentosFields,
    append: appendAgendamento,
    remove: removeAgendamento,
  } = useFieldArray({
    control: form.control,
    name: "agendamentos",
  });

  useEffect(() => {
    if (open) {
      financeiroService.getProfissionais().then(setProfissionais);
      financeiroService.getPacientes().then(setPacientes);
      financeiroService.getServicos().then((todosOsServicos) => {
        const servicosFiltrados = todosOsServicos.filter((s) => s.categoria === categoriaFilter);
        setServicos(servicosFiltrados);

        // Auto-select the first service if available
        if (servicosFiltrados.length > 0) {
          form.setValue("servico_id", servicosFiltrados[0].id);
        } else {
          form.setValue("servico_id", "");
        }
      });
    }
  }, [open, categoriaFilter, form]); // <-- Add dependencies


  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      // Construct the final payload to match VendaCreate
      const payload = {
        data_venda: data.data_venda,
        valor_total: data.valor_total,
        observacao: data.observacao,
        paciente_id: data.paciente_id || null,
        paciente_nome: data.paciente_nome,

        parcelas: data.parcelas.map(p => ({
          valor_parcela: p.valor_parcela,
          data_vencimento: p.data_vencimento,
          data_pagamento: p.data_pagamento || null,
          metodo_pagamento: p.metodo_pagamento || null,
          status: p.data_pagamento ? "PAGO" : "PENDENTE"
        })),

        agendamentos: data.agendamentos.map(a => ({
          servico_id: data.servico_id,
          profissional_id: data.profissional_id,
          data_competencia: a.data_competencia || null,
          hora_inicio: a.hora_inicio || null,
          hora_fim: a.hora_fim || null,
        }))
      };

      await financeiroService.createVenda(payload as any);
      if (onSuccess) onSuccess();
      toast.success("Venda registrada com sucesso!");
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao registrar a venda.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Nova Venda / Contrato</DialogTitle>
          <DialogDescription className="sr-only">
            Formulário para registrar uma nova venda e suas parcelas financeiras.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* --- SECTION 1: PARENT DATA (VENDA) --- */}
            <div className="p-5 bg-muted/10 rounded-lg border space-y-5 shadow-sm">
              <h3 className="font-semibold text-base flex items-center gap-2 text-foreground/80">
                1. Dados Gerais do Contrato
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="paciente_nome"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Paciente</FormLabel>
                      <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between font-normal bg-background"
                            >
                              {field.value || "Criar ou Selecionar paciente..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Digite o nome..." onValueChange={setSearchValue} />
                            <CommandList className="max-h-60 overflow-y-auto">
                              <CommandEmpty className="p-1">
                                <Button
                                  variant="ghost"
                                  className="w-full justify-start text-xs gap-2"
                                  onClick={() => {
                                    form.setValue("paciente_nome", searchValue);
                                    form.setValue("paciente_id", "");
                                    setComboboxOpen(false);
                                  }}
                                >
                                  <Plus className="h-3 w-3" />
                                  Criar novo: "{searchValue}"
                                </Button>
                              </CommandEmpty>
                              <CommandGroup>
                                {pacientes.map((p) => (
                                  <CommandItem
                                    key={p.id}
                                    value={p.nome}
                                    onSelect={(currentValue) => {
                                      form.setValue("paciente_nome", currentValue);
                                      form.setValue("paciente_id", p.id);
                                      setComboboxOpen(false);
                                    }}
                                  >
                                    <Check className={cn("mr-2 h-4 w-4", field.value === p.nome ? "opacity-100" : "opacity-0")} />
                                    {p.nome}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data_venda"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data da Venda</FormLabel>
                      <FormControl>
                        <SmartDatePicker value={field.value} onChange={field.onChange} disableFutureDates={true} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Service and Professional now live here! */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="servico_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serviço Principal</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger className="bg-background"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {servicos.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="profissional_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profissional</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger className="bg-background"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {profissionais.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="valor_total"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Total (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" className="bg-background text-lg font-semibold" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observacao"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Observações do Contrato</FormLabel>
                      <FormControl>
                        <Input className="bg-background" placeholder="Ex: Pacote de 10 sessões acordado via WhatsApp" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* --- SECTION 2: THE SUOR (AGENDAMENTOS) --- */}
            <div className="p-5 bg-slate-50/50 dark:bg-slate-900/20 rounded-lg border space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base flex items-center gap-2 text-foreground/80">
                  2. Sessões / Competência
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendAgendamento({ data_competencia: "", hora_inicio: "", hora_fim: "" })}
                  className="bg-background shadow-sm hover:bg-accent"
                >
                  <CalendarPlus className="mr-2 h-4 w-4" /> Adicionar Sessão
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {agendamentosFields.map((item, index) => {
                  // Listen to the date field to enable/disable time inputs
                  const dataSelecionada = form.watch(`agendamentos.${index}.data_competencia`);
                  const isHorarioHabilitado = !!dataSelecionada;

                  return (
                    <div key={item.id} className="relative flex flex-col gap-3 p-4 border rounded-md bg-background shadow-sm">
                      <FormField
                        control={form.control}
                        name={`agendamentos.${index}.data_competencia`}
                        render={({ field }) => (
                          <FormItem className="flex-1 flex flex-col">
                            <FormLabel className="text-xs text-muted-foreground">Data (Sessão {index + 1})</FormLabel>
                            <FormControl>
                              <SmartDatePicker
                                value={field.value}
                                onChange={(val: any) => {
                                  field.onChange(val);
                                  // Clear time inputs if date is cleared
                                  if (!val) {
                                    form.setValue(`agendamentos.${index}.hora_inicio`, "");
                                    form.setValue(`agendamentos.${index}.hora_fim`, "");
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <FormField
                          control={form.control}
                          name={`agendamentos.${index}.hora_inicio`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-muted-foreground">Início</FormLabel>
                              <FormControl>
                                <Input
                                  type="time"
                                  disabled={!isHorarioHabilitado}
                                  // Fix: Add right margin to the native clock icon to prevent it from touching the border
                                  className="h-9 w-full min-w-0 pl-2 text-xs bg-background disabled:opacity-50 [&::-webkit-calendar-picker-indicator]:mr-1"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`agendamentos.${index}.hora_fim`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-muted-foreground">Fim</FormLabel>
                              <FormControl>
                                <Input
                                  type="time"
                                  disabled={!isHorarioHabilitado}
                                  // Fix: Add right margin to the native clock icon to prevent it from touching the border
                                  className="h-9 w-full min-w-0 pl-2 text-xs bg-background disabled:opacity-50 [&::-webkit-calendar-picker-indicator]:mr-1"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAgendamento(index)}
                        disabled={agendamentosFields.length === 1}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background border shadow-sm text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* --- SECTION 3: THE CAIXA (PARCELAS) --- */}
            <div className="p-5 bg-slate-50/50 dark:bg-slate-900/20 rounded-lg border space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base flex items-center gap-2 text-foreground/80">
                  3. Financeiro / Parcelas
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendParcela({
                      valor_parcela: 0,
                      data_vencimento: todayStr,
                      metodo_pagamento: "PIX",
                      data_pagamento: "",
                    })
                  }
                  className="bg-background shadow-sm hover:bg-accent"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Parcela
                </Button>
              </div>

              {parcelasFields.map((item, index) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start border-b pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">

                  <FormField
                    control={form.control}
                    name={`parcelas.${index}.valor_parcela`}
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-xs text-muted-foreground">Valor (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" className="bg-background" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`parcelas.${index}.data_vencimento`}
                    render={({ field }) => (
                      <FormItem className="md:col-span-3 flex flex-col">
                        <FormLabel className="text-xs text-muted-foreground">Vencimento</FormLabel>
                        <FormControl>
                          <SmartDatePicker value={field.value} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`parcelas.${index}.metodo_pagamento`}
                    render={({ field }) => (
                      <FormItem className="md:col-span-3">
                        <FormLabel className="text-xs text-muted-foreground">Método (Opcional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger className="bg-background"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PIX">PIX</SelectItem>
                            <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                            <SelectItem value="CREDITO">Cartão Crédito</SelectItem>
                            <SelectItem value="DEBITO">Cartão Débito</SelectItem>
                            <SelectItem value="CONVENIO">Convênio</SelectItem>
                            <SelectItem value="CORTESIA">Cortesia</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`parcelas.${index}.data_pagamento`}
                    render={({ field }) => (
                      <FormItem className="md:col-span-2 flex flex-col">
                        <FormLabel className="text-xs text-muted-foreground">Pago em (Opcional)</FormLabel>
                        <FormControl>
                          <SmartDatePicker value={field.value} onChange={field.onChange} disableFutureDates={true} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="md:col-span-1 flex justify-end mt-6">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeParcela(index)}
                      disabled={parcelasFields.length === 1}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 "
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter className="pt-2 flex items-center justify-between sm:justify-between w-full">
              <div className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Aviso:</span> A soma das parcelas deve bater com o total.
              </div>
              <div className="flex gap-2">
                <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-slate-900 text-white hover:bg-slate-800">
                  Registrar Contrato
                </Button>
              </div>
            </DialogFooter>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}