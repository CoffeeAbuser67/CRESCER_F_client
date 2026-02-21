/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Loader2, Stethoscope, Armchair } from "lucide-react";
import { toast } from "react-toastify";

import { financeiroService } from "@/services/financeiroService";
import type { Servico } from "@/utils/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
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
import { Badge } from "@/components/ui/badge";

// O Schema reflete o seu Enum do Backend
const formSchema = z.object({
    nome: z.string().min(3, "O nome deve ter no mínimo 3 caracteres"),
    categoria: z.enum(["CONSULTA", "TERAPIA"], {
        message: "Selecione uma categoria",
    }),
});

export function ServicosManager() {
    const [servicos, setServicos] = useState<Servico[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            nome: "",
            categoria: undefined,
        },
    });

    const carregarServicos = async () => {
        setIsLoading(true);
        try {
            const data = await financeiroService.getServicos();
            setServicos(data);
        } catch (error) {
            toast.error("Erro ao carregar serviços.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        carregarServicos();
    }, []);

    const onSubmit = async (data: any) => {
        setIsSaving(true);
        try {
            await financeiroService.createServico(data);
            toast.success("Serviço cadastrado com sucesso!");
            setIsDialogOpen(false);
            form.reset();
            carregarServicos();
        } catch (error: any) {
            if (error.response?.status === 409) {
                toast.error(error.response.data.detail);
            } else {
                toast.error("Erro ao cadastrar serviço.");
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Barra de Ações */}
            <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                    Gerencie os serviços e defina como eles se comportam no Livro Caixa.
                </div>
                <Button onClick={() => setIsDialogOpen(true)} className="shadow-sm">
                    <Plus className="mr-2 h-4 w-4" /> Cadastrar Serviço
                </Button>
            </div>

            {/* Tabela de Dados */}
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome do Serviço</TableHead>
                            <TableHead className="w-[200px]">Categoria</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={2} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : servicos.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                                    Nenhum serviço cadastrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            servicos.map((servico) => (
                                <TableRow key={servico.id}>
                                    <TableCell className="font-medium">{servico.nome}</TableCell>
                                    <TableCell>
                                        {servico.categoria === "CONSULTA" ? (
                                            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200 gap-1">
                                                <Stethoscope className="h-3 w-3" /> Consulta
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-200 gap-1">
                                                <Armchair className="h-3 w-3" /> Terapia
                                            </Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Modal de Criação */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Novo Serviço</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">

                            <FormField
                                control={form.control}
                                name="nome"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome do Serviço</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Sessão de Psicologia" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="categoria"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Categoria Operacional</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione a categoria..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="CONSULTA">Consulta Médica</SelectItem>
                                                <SelectItem value="TERAPIA">Terapia / Sessão</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter className="pt-4">
                                <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Salvar"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}