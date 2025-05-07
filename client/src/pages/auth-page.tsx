import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  Card, 
  CardContent,
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";

import { Loader2 } from "lucide-react";

// Schema para validação do formulário de login
const loginSchema = z.object({
  username: z.string().min(3, "O nome de usuário deve ter pelo menos 3 caracteres"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

// Schema para validação do formulário de registro
const registerSchema = z.object({
  username: z.string().min(3, "O nome de usuário deve ter pelo menos 3 caracteres"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  email: z.string().email("Email inválido"),
  displayName: z.string().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [location, navigate] = useLocation();

  // Redirecionar para a página inicial se o usuário já estiver autenticado
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      displayName: "",
    },
  });

  // Login submit handler
  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        navigate("/");
      }
    });
  };

  // Register submit handler
  const onRegisterSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data, {
      onSuccess: () => {
        navigate("/");
      }
    });
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Coluna de formulário */}
      <div className="flex flex-col justify-center flex-1 px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="w-full max-w-sm mx-auto lg:w-96">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Proxxima Store</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sistema de pontos e recompensas para funcionários
            </p>
          </div>

          <Card className="border-primary/20 overflow-hidden shadow-md">
            <div className="bg-gradient-to-r from-primary to-secondary h-2"></div>
            <CardHeader className="bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardTitle className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Acesse sua conta</CardTitle>
              <CardDescription>
                Entre com seu nome de usuário e senha para acessar o sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-medium">Nome de usuário</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="nome_usuario" 
                            {...field}
                            className="border-primary/20 focus-visible:ring-primary/30" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-medium">Senha</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="******" 
                            {...field}
                            className="border-primary/20 focus-visible:ring-primary/30" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 border-0 mt-6" 
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      "Entrar"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 border-t border-primary/10">
              <p className="text-sm text-primary/70">
                Entre em contato com um administrador para criar sua conta.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Coluna hero */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary flex flex-col justify-center items-center p-12 text-white">
          <div className="max-w-md mx-auto">
            <h2 className="text-4xl font-bold mb-6">Sistema de Recompensas</h2>
            <p className="text-xl mb-8">
              Uma plataforma para reconhecer e recompensar o trabalho dos funcionários através de um 
              sistema de pontos que podem ser trocados por produtos.
            </p>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-white bg-opacity-20 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium">Acumule Pontos</h3>
                  <p className="mt-1">Ganhe pontos por bom desempenho e participação em projetos.</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-white bg-opacity-20 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium">Troque por Produtos</h3>
                  <p className="mt-1">Use seus pontos para obter produtos exclusivos no catálogo.</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-white bg-opacity-20 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium">Acompanhe seu Histórico</h3>
                  <p className="mt-1">Visualize todas as transações e seus produtos resgatados.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}