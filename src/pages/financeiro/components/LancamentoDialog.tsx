/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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

import { financeiroService } from "@/services/financeiroService";
import type { Servico, Profissional } from "@/utils/types";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "react-toastify";
import { SmartDatePicker } from "@/components/date-picker-simple";


// --- SCHEMA ---
const formSchema = z
  .object({
    data_pagamento: z.string().min(1, "Obrigatório"),
    data_competencia: z.string().min(1, "Obrigatório"),
    valor: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
    metodo_pagamento: z.enum([
      "PIX",
      "DINHEIRO",
      "CARTAO_CREDITO",
      "CARTAO_DEBITO",
    ]),
    servico_id: z.string().uuid("Selecione um serviço"),
    profissional_id: z.string().uuid("Selecione um profissional"),
    observacao: z.string().optional(),
    paciente_id: z.string().optional(),
    paciente_nome: z.string().optional(),
  })
  .refine(data => data.paciente_nome && data.paciente_nome.trim().length > 0, {
    message: "Selecione ou digite um paciente",
    path: ["paciente_nome"]
  });

interface LancamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  categoriaFilter: string;
}

export function LancamentoDialog({
  open,
  onOpenChange,
  onSuccess,
  categoriaFilter = "CONSULTA",
}: LancamentoDialogProps) {
  const [pacientes, setPacientes] = useState<{ id: string, nome: string }[]>([]);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);

  const form = useForm({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      data_pagamento: new Date().toISOString().split("T")[0],
      data_competencia: new Date().toISOString().split("T")[0],
      metodo_pagamento: "PIX",
      valor: 0,
      observacao: "",
      paciente_nome: "",
      profissional_id: "",
      servico_id: "",
    },
  });


  useEffect(() => {
    if (open) {
      // 1. Carrega os dados básicos
      financeiroService.getProfissionais().then(setProfissionais);
      financeiroService.getPacientes().then(setPacientes);

      // 2. Carrega os serviços e aplica as regras de negócio automáticas
      financeiroService.getServicos().then((todosOsServicos) => {
        const servicosFiltrados = todosOsServicos.filter((s) => s.categoria === categoriaFilter);
        setServicos(servicosFiltrados);

        // Regra da CONSULTA: Auto-seleciona o serviço de consulta
        if (categoriaFilter === "CONSULTA" && servicosFiltrados.length > 0) {
          form.setValue("servico_id", servicosFiltrados[0].id);
        }

      });
    }
  }, [open, categoriaFilter, form]);


  async function onSubmit(data: any) {
    try {
      await financeiroService.createLancamento(data);
      if (onSuccess) onSuccess();
      toast.success("Lançamento realizado com sucesso!");
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar lançamento.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>
            {categoriaFilter === "CONSULTA" ? "Nova Consulta" : "Nova Terapia"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_pagamento"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Pagamento</FormLabel>
                    <FormControl>
                      <SmartDatePicker
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_competencia"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Competência</FormLabel>
                    <FormControl>
                      <SmartDatePicker
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" onPointerDownOutside={(e) => e.preventDefault()} onTouchMove={(e) => e.stopPropagation()}>
                      <Command>
                        <CommandInput
                          placeholder="Digite o nome..."
                          onValueChange={setSearchValue}
                        />
                        <CommandList
                          className="max-h-60 overflow-y-auto"
                          onWheel={(e) => e.stopPropagation()}
                        >
                          <CommandEmpty className="p-1">
                            <Button
                              variant="ghost"
                              className="w-full justify-start text-xs gap-2"
                              onClick={() => {
                                form.setValue("paciente_nome", searchValue);
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

            <div className="grid grid-cols-2 gap-4">

              {categoriaFilter === "TERAPIA" && (
                <FormField
                  control={form.control}
                  name="servico_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serviço</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent position="popper" className="max-h-60">
                          {servicos.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}


              <FormField
                control={form.control}
                name="profissional_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profissional</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper" className="max-h-60">
                        {profissionais.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />


              {/* Sempre visíveis */}
              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="metodo_pagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Método" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper" className="max-h-60">
                        <SelectItem value="PIX">PIX</SelectItem>
                        <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                        <SelectItem value="CARTAO_CREDITO">Cartão Crédito</SelectItem>
                        <SelectItem value="CARTAO_DEBITO">Cartão Débito</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="observacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações / Anotações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalhes adicionais sobre o lançamento..."
                      className="resize-none h-24 mt-1"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>

              <Button
                type="submit"
                className={categoriaFilter === "TERAPIA" ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""}
              >
                Salvar
              </Button>

            </DialogFooter>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}