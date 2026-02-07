import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

// Imports novos da arquitetura limpa
import { authService } from "@/services/authService";
import { useUserStore } from "@/store/userStore";

// Schema de validação
const loginSchema = z.object({
  username: z.string().min(1, "E-mail é obrigatório").email("Formato de e-mail inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useUserStore(); // <--- Usamos setUser, não mais checkSession
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormInputs) => {
    setIsLoading(true);
    try {
      // 1. Faz o login usando o service (que usa a api.ts nova)
      const userData = await authService.login({
        username: data.username,
        password: data.password
      });

      // 2. Atualiza a store globalmente com os dados recebidos
      setUser(userData);

      // 3. Feedback e Redirecionamento
      toast.success(`Bem-vindo, ${userData.username || 'Usuário'}!`);
      navigate("/dashboard");

    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.detail || "Erro ao realizar login";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Acesso ao Sistema</CardTitle>
          <CardDescription>Digite suas credenciais para entrar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Campo E-mail */}
            <div className="space-y-2">
              <Label htmlFor="username">E-mail</Label>
              <Input
                id="username"
                placeholder="seu@email.com"
                type="email"
                {...register("username")}
              />
              {errors.username && (
                <p className="text-sm text-red-500">{errors.username.message}</p>
              )}
            </div>

            {/* Campo Senha */}
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="******"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Botão de Login */}
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
            
          </form>
        </CardContent>
      </Card>
    </div>
  );
}