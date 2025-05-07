import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { UserRoleEnum } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Tipos de usuário
export type User = {
  id: number;
  username: string;
  email: string;
  displayName: string | null;
  role: typeof UserRoleEnum.ADMIN | typeof UserRoleEnum.EMPLOYEE;
  points: number;
  unit: string | null;
  profileImageUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

// Parâmetros para login
export type LoginData = {
  username: string;
  password: string;
};

// Parâmetros para registro
export type RegisterData = {
  username: string;
  password: string;
  email: string;
  displayName?: string;
  role?: typeof UserRoleEnum.ADMIN | typeof UserRoleEnum.EMPLOYEE;
};

// Contexto de autenticação
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  isAdmin: boolean;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // Busca informações do usuário autenticado
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: false,
    staleTime: 0
  });

  // Determina se o usuário é administrador
  const isAdmin = user?.role === UserRoleEnum.ADMIN;

  // Mutação para login
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: User) => {
      // Invalidar a consulta atual para forçar uma nova busca
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      // Atualizar o cache também
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo${user.displayName ? `, ${user.displayName}` : ""}!`,
      });
      // Pequeno atraso antes de refetch para garantir que tudo foi atualizado
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["/api/user"] });
      }, 300);
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no login",
        description: "Nome de usuário ou senha incorretos.",
        variant: "destructive",
      });
    },
  });

  // Mutação para registro
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: (user: User) => {
      // Invalidar a consulta atual para forçar uma nova busca
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      // Atualizar o cache também
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registro realizado com sucesso",
        description: "Sua conta foi criada e você já está logado.",
      });
      // Pequeno atraso antes de refetch para garantir que tudo foi atualizado
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["/api/user"] });
      }, 300);
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no registro",
        description: error.message || "Não foi possível criar a conta. Tente outro nome de usuário.",
        variant: "destructive",
      });
    },
  });

  // Mutação para logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      // Atualizar o cache para null
      queryClient.setQueryData(["/api/user"], null);
      // Invalidar a consulta
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Logout realizado com sucesso",
        description: "Você saiu da sua conta.",
      });
      
      // Pequeno atraso antes de refetch para garantir que tudo foi atualizado
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["/api/user"] });
      }, 300);
    },
    onError: (error: Error) => {
      toast({
        title: "Falha ao sair",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        isAdmin,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}