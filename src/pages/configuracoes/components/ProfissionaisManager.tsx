/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

import { financeiroService } from "@/services/financeiroService";
import type { Profissional } from "@/utils/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

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
import { Badge } from "@/components/ui/badge";

// Schema de validação para a criação
const formSchema = z.object({
    nome: z.string().min(3, "O nome deve ter no mínimo 3 caracteres"),
    especialidade: z.string().optional()
});

export function ProfissionaisManager() {
    const [profissionais, setProfissionais] = useState<Profissional[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            nome: "",
            especialidade: "",
        },
    });

    const carregarProfissionais = async () => {
        setIsLoading(true);
        try {
            // Usa a rota de ADMIN para trazer todos (ativos e inativos)
            const data = await financeiroService.getTodosProfissionais();
            setProfissionais(data);
        } catch (error) {
            toast.error("Erro ao carregar profissionais.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        carregarProfissionais();
    }, []);

    // --- Função: Criar Novo Profissional ---
    const onSubmit = async (data: any) => {
        setIsSaving(true);
        try {
            // Reutilizamos a rota normal de POST que já existe no seu backend
            await financeiroService.createProfissional(data);
            toast.success("Profissional cadastrado com sucesso!");
            setIsDialogOpen(false);
            form.reset();
            carregarProfissionais();
        } catch (error: any) {
            // O seu backend lança 409 se o nome já existir, mostramos esse erro
            if (error.response?.status === 409) {
                toast.error(error.response.data.detail);
            } else {
                toast.error("Erro ao cadastrar profissional.");
            }
        } finally {
            setIsSaving(false);
        }
    };

    // --- Função: Alternar Status (Soft Delete) ---
    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        // Atualização Otimista: Muda na tela antes do servidor responder para parecer instantâneo
        setProfissionais((prev) =>
            prev.map((p) => (p.id === id ? { ...p, ativo: !currentStatus } : p))
        );

        try {
            await financeiroService.toggleProfissionalStatus(id);
            toast.success(currentStatus ? "Profissional inativado." : "Profissional reativado.");
        } catch (error) {
            // Se falhar no servidor, reverte a tela para o estado original
            toast.error("Erro ao atualizar status.");
            carregarProfissionais();
        }
    };

    return (
        <div className="space-y-4">
            {/* Barra de Ações */}
            <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                    Gerencie o acesso da equipe clínica ao Livro Caixa.
                </div>
                <Button onClick={() => setIsDialogOpen(true)} className="shadow-sm">
                    <Plus className="mr-2 h-4 w-4" /> Cadastrar Profissional
                </Button>
            </div>

            {/* Tabela de Dados */}
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome do Profissional</TableHead>
                            <TableHead>Especialidade</TableHead>
                            <TableHead className="w-[150px]">Status</TableHead>
                            <TableHead className="w-[100px] text-right">Acesso</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : profissionais.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                    Nenhum profissional cadastrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            profissionais.map((prof) => (
                                <TableRow key={prof.id} className={!prof.ativo ? "opacity-60 bg-muted/5" : ""}>
                                    <TableCell className="font-medium">{prof.nome}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {prof.especialidade || "-"}
                                    </TableCell>

                                    <TableCell>
                                        {prof.ativo ? (
                                            <Badge variant="default" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 shadow-none">Ativo</Badge>
                                        ) : (
                                            <Badge variant="secondary" className="text-muted-foreground">Inativo</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Switch
                                            checked={prof.ativo}
                                            onCheckedChange={() => handleToggleStatus(prof.id, prof.ativo)}
                                        />
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
                        <DialogTitle>Novo Profissional</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                            <FormField
                                control={form.control}
                                name="nome"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome Completo</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Dr. João da Silva" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />


                            <FormField
                                control={form.control}
                                name="especialidade"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Especialidade (Opcional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Fonoaudiologia, Psicologia..." {...field} />
                                        </FormControl>
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