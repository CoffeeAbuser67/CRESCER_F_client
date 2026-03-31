/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Loader2, Trash2, ShieldAlert, User } from "lucide-react";
import { toast } from "react-toastify";

// Assumindo que você vai adicionar essas funções no seu authService depois
import { authService } from "@/services/authService";
import type { User as UsuarioType } from "@/utils/types"; // Renomeado para evitar conflito com o ícone User

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


const formSchema = z.object({
    username: z.string().min(3, "Mínimo de 3 caracteres"),
    email: z.string().email("Digite um e-mail válido"),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
    role: z.enum(["ADMIN", "COMUM"], {
        message: "Selecione o nível de permissão",
    }),
});

export function UsuariosManager() {
    const [usuarios, setUsuarios] = useState<UsuarioType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [usuarioToDelete, setUsuarioToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const form = useForm({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            username: "",
            email: "",
            password: "",
            role: "COMUM",
        },
    });

    const carregarUsuarios = async () => {
        setIsLoading(true);
        try {
            // Essa função precisará ser criada no authService batendo no GET /auth/usuarios
            const data = await authService.getUsuarios();
            setUsuarios(data);
        } catch (error) {
            toast.error("Erro ao carregar usuários.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        carregarUsuarios();
    }, []);

    const onSubmit = async (data: any) => {
        setIsSaving(true);
        try {
            // Essa é a rota /register que já temos! Só precisa estar mapeada no authService
            await authService.register(data);
            toast.success("Usuário criado com sucesso!");
            setIsDialogOpen(false);
            form.reset();
            carregarUsuarios();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Erro ao criar usuário.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!usuarioToDelete) return;
        setIsDeleting(true);
        setUsuarios((prev) => prev.filter((u) => String(u.id) !== usuarioToDelete));
        
        try {
            await authService.deleteUsuario(usuarioToDelete);
            toast.success("Usuário removido do sistema.");
        } catch (error) {
            toast.error("Erro ao remover usuário.");
            carregarUsuarios(); 
        } finally {
            setIsDeleting(false);
            setUsuarioToDelete(null);
        }
    };


    return (
        <div className="space-y-4">
            {/* Barra de Ações */}
            <div className="flex justify-between items-center gap-4">
                <div className="text-sm text-muted-foreground">
                    Gerencie quem tem acesso ao painel e quais são suas permissões.
                </div>
                <Button onClick={() => setIsDialogOpen(true)} className="shadow-sm bg-slate-900 hover:bg-slate-800 text-white">
                    <Plus className="mr-2 h-4 w-4" /> Usuário
                </Button>
            </div>

            {/* Tabela de Dados */}
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Usuário</TableHead>
                            <TableHead>E-mail</TableHead>
                            <TableHead>Permissão</TableHead>
                            <TableHead className="w-[100px] text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : usuarios.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    Nenhum usuário encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            usuarios.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.username}</TableCell>
                                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                    <TableCell>
                                        {user.role === "ADMIN" ? (
                                            <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-200 gap-1">
                                                <ShieldAlert className="h-3 w-3" /> Admin
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-slate-500/10 text-slate-600 border-slate-200 gap-1">
                                                <User className="h-3 w-3" /> Staff
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setUsuarioToDelete(String(user.id))} // <- Abre o modal!
                                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                            title="Remover Usuário"
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
                        <DialogTitle>Novo Acesso</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">

                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome de Usuário</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Maria" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>E-mail de Login</FormLabel>
                                        <FormControl>
                                            <Input placeholder="maria@clinica.com" type="email" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Senha Provisória</FormLabel>
                                        <FormControl>
                                            <Input placeholder="******" type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nível de Permissão</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione a permissão..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="COMUM">Staff (Apenas Livro Caixa)</SelectItem>
                                                <SelectItem value="ADMIN">Administrador (Acesso Total)</SelectItem>
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
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Criar Acesso"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!usuarioToDelete} onOpenChange={(open) => !open && setUsuarioToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Usuário?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação removerá permanentemente o acesso deste usuário ao sistema. 
                            Tem certeza que deseja prosseguir?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDeleteConfirm();
                            }}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                            disabled={isDeleting}
                        >
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}