/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Loader2, X, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

import { financeiroService } from "@/services/financeiroService";
import type { Profissional } from "@/utils/types";

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
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
    nome: z.string().min(3, "O nome deve ter no mínimo 3 caracteres"),
    especialidades: z.array(z.string()).default([]),
});

type ProfissionalFormValues = z.infer<typeof formSchema>;


export function ProfissionaisManager() {
    const [profissionais, setProfissionais] = useState<Profissional[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<ProfissionalFormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            nome: "",
            especialidades: [], // Agora o TS sabe que isso é um string[], não um never[]
        },
    });


    const carregarProfissionais = async () => {
        setIsLoading(true);
        try {
            const data = await financeiroService.getTodosProfissionais();
            // Filtramos direto no frontend para ignorar (esconder) os inativos
            setProfissionais(data.filter((p) => p.ativo));
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

    const handleDelete = async (id: string) => {
        // Atualização Otimista: Remove o profissional da tela na hora
        setProfissionais((prev) => prev.filter((p) => p.id !== id));

        try {
            // Como ele estava ativo, o toggle inverte para falso (Inativo = Soft Delete)
            await financeiroService.toggleProfissionalStatus(id);
            toast.success("Profissional removido com sucesso.");
        } catch (error) {
            // Se falhar, recarrega a lista para mostrar ele de volta
            toast.error("Erro ao remover profissional.");
            carregarProfissionais();
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
            <div className="flex justify-between gap-4 items-center">
                <div className="text-sm text-muted-foreground">
                    Gerencie o acesso da equipe clínica ao Livro Caixa.
                </div>
                <Button onClick={() => setIsDialogOpen(true)} className="shadow-sm">
                    <Plus className="mr-2 h-4 w-4" />Profissional
                </Button>
            </div>

            {/* Tabela de Dados */}
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome do Profissional</TableHead>
                            <TableHead>Especialidades</TableHead>
                            <TableHead className="w-25 text-right">Ações</TableHead>
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
                                <TableRow key={prof.id}>
                                    <TableCell className="font-medium">{prof.nome}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {prof.especialidades && prof.especialidades.length > 0 ? (
                                                prof.especialidades.map((esp) => (
                                                    <Badge key={esp.id} variant="secondary" className="font-normal text-xs">
                                                        {esp.nome}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </div>
                                    </TableCell>

                                    {/* Botão de Lixeira */}
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(prof.id)}
                                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                            title="Remover Profissional"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
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
                                name="especialidades"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Especialidades (Tags)</FormLabel>
                                        <FormControl>
                                            <div className="flex flex-col gap-2">

                                                {/* Área onde as tags selecionadas aparecem */}
                                                {field.value.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mb-1">
                                                        {field.value.map((tag: string, index: number) => (
                                                            <Badge key={index} variant="default" className="gap-1.5 pr-1.5 bg-primary/90">
                                                                {tag}
                                                                <button
                                                                    type="button"
                                                                    className="h-4 w-4 rounded-full hover:bg-background/20 flex items-center justify-center transition-colors"
                                                                    onClick={() => {
                                                                        const newTags = field.value.filter((_: string, i: number) => i !== index);
                                                                        field.onChange(newTags);
                                                                    }}
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* O Input para digitar novas tags */}
                                                <Input
                                                    placeholder="Digite a especialidade e aperte Enter..."
                                                    onKeyDown={(e) => {
                                                        // Se apertar Enter ou Vírgula
                                                        if (e.key === 'Enter' || e.key === ',') {
                                                            e.preventDefault(); // Impede o formulário de ser enviado!

                                                            const newTag = e.currentTarget.value.trim();

                                                            // Se tem texto e a tag ainda não existe no array
                                                            if (newTag && !field.value.includes(newTag)) {
                                                                field.onChange([...field.value, newTag]);
                                                                e.currentTarget.value = ''; // Limpa o input
                                                            }
                                                        }
                                                    }}
                                                />
                                                <p className="text-[10px] text-muted-foreground mt-1">
                                                    Aperte Enter para adicionar múltiplas especialidades.
                                                </p>

                                            </div>
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