/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SmartDatePicker } from "@/components/date-picker-simple";
import type { ParcelaTableRow } from "./columns";
import { financeiroService } from "@/services/financeiroService";
import { toast } from "react-toastify";
import { useEffect } from "react";

const todayStr = new Date().toISOString().split("T")[0];


// Define the schema with 'message' property as requested by TS overload
const formSchema = z.object({
  data_pagamento: z.string().min(1, "Required").refine((date) => date <= todayStr, "Cannot be a future date"),
  
  metodo_pagamento: z.enum(["PIX", "DINHEIRO", "CREDITO", "DEBITO", "CONVENIO", "CORTESIA"] , {
    message: "Select a payment method",
  }),
});




interface BaixaDialogProps {
  parcela: ParcelaTableRow | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function BaixaDialog({ parcela, onClose, onSuccess }: BaixaDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      data_pagamento: todayStr, // Default to today
      metodo_pagamento: undefined,
    },
  });

  // Reset form when opening a new parcela
  useEffect(() => {
    if (parcela) {
      form.reset({ data_pagamento: todayStr, metodo_pagamento: undefined });
    }
  }, [parcela, form]);

async function onSubmit(data: z.infer<typeof formSchema>) {
    if (!parcela) return;
    try {
      await financeiroService.darBaixaParcela(parcela.id, data as any);
      toast.success("Baixa realizada com sucesso!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao dar baixa.");
    }
  }

  return (
    <Dialog open={!!parcela} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-100">
        <DialogHeader>
          <DialogTitle>Confirmar Recebimento</DialogTitle>
          <DialogDescription>
            {parcela?.paciente.nome} - Parcela {parcela?.numero_parcela}/{parcela?.total_parcelas}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <FormField
              control={form.control}
              name="data_pagamento"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Recebido em</FormLabel>
                  <FormControl>
                    <SmartDatePicker value={field.value} onChange={field.onChange} disableFutureDates={true} />
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
                  <FormLabel>Método de Pagamento</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o método" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                      <SelectItem value="CREDITO">Cartão de Crédito</SelectItem>
                      <SelectItem value="DEBITO">Cartão de Débito</SelectItem>
                      <SelectItem value="CONVENIO">Convênio</SelectItem>
                      <SelectItem value="CORTESIA">Cortesia</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                Confirmar Baixa
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}