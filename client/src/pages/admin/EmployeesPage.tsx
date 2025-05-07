import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User, UserRoleEnum } from "@shared/schema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

// Componentes
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  PlusCircle, 
  UserPlus, 
  Pencil, 
  Trash2, 
  MoreHorizontal,
  Award
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Layout
import Layout from "@/components/Layout";

// Schema para o formulário de adicionar xCoins
const pointsFormSchema = z.object({
  points: z.coerce.number().int().min(1, "Mínimo de 1 xCoin"),
  description: z.string().min(3, "Descrição é obrigatória"),
});

type PointsFormValues = z.infer<typeof pointsFormSchema>;

// Schema para o formulário de registro
const registerSchema = z.object({
  username: z.string().min(3, "O nome de usuário deve ter pelo menos 3 caracteres"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  email: z.string().email("Email inválido"),
  displayName: z.string().optional(),
  role: z.enum([UserRoleEnum.ADMIN, UserRoleEnum.EMPLOYEE]),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

// Schema para o formulário de edição
const editUserSchema = z.object({
  username: z.string().min(3, "O nome de usuário deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  displayName: z.string().optional(),
  unit: z.string().optional(),
  role: z.enum([UserRoleEnum.ADMIN, UserRoleEnum.EMPLOYEE]),
  password: z.string().optional().refine(val => !val || val.length >= 6, {
    message: "A senha deve ter pelo menos 6 caracteres"
  }),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

export default function EmployeesPage() {
  const { isAdmin, user: currentUser } = useAuth();
  const { toast } = useToast();
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [isPointsDialogOpen, setIsPointsDialogOpen] = useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Consulta para obter todos os funcionários
  const { data: employees, isLoading, error } = useQuery<User[]>({
    queryKey: ['/api/admin/employees'],
    enabled: !!isAdmin,
  });

  // Formulário para adicionar xCoins
  const pointsForm = useForm<PointsFormValues>({
    resolver: zodResolver(pointsFormSchema),
    defaultValues: {
      points: 10,
      description: "",
    },
  });

  // Formulário para registrar novo funcionário
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      displayName: "",
      role: UserRoleEnum.EMPLOYEE,
    },
  });

  // Mutação para adicionar xCoins
  const addPointsMutation = useMutation({
    mutationFn: async ({ userId, points, description }: { userId: number; points: number; description: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/points`, { points, description });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/employees'] });
      setIsPointsDialogOpen(false);
      pointsForm.reset();
      toast({
        title: "xCoins adicionados com sucesso",
        description: "Os xCoins foram creditados na conta do funcionário.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar xCoins",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Formulário para editar funcionário
  const editForm = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      username: "",
      email: "",
      displayName: "",
      unit: "",
      role: UserRoleEnum.EMPLOYEE,
      password: "",
    },
  });

  // Mutação para registrar novo funcionário
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormValues) => {
      const res = await apiRequest("POST", "/api/register", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/employees'] });
      setIsRegisterDialogOpen(false);
      registerForm.reset();
      toast({
        title: "Funcionário registrado com sucesso",
        description: "O novo funcionário foi adicionado ao sistema.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao registrar funcionário",
        description: error.message || "Não foi possível criar a conta. Tente outro nome de usuário.",
        variant: "destructive",
      });
    },
  });
  
  // Mutação para editar usuário
  const editUserMutation = useMutation({
    mutationFn: async (data: { id: number; userData: EditUserFormValues }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${data.id}`, data.userData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/employees'] });
      setIsEditDialogOpen(false);
      editForm.reset();
      toast({
        title: "Usuário atualizado com sucesso",
        description: "As informações do usuário foram atualizadas.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message || "Não foi possível atualizar o usuário.",
        variant: "destructive",
      });
    },
  });
  
  // Mutação para excluir usuário
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/employees'] });
      setIsDeleteDialogOpen(false);
      setSelectedEmployee(null);
      toast({
        title: "Usuário excluído com sucesso",
        description: "O usuário foi removido do sistema.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir usuário",
        description: error.message || "Não foi possível excluir o usuário.",
        variant: "destructive",
      });
    },
  });

  // Handler para abrir o diálogo de adicionar xCoins
  const handleOpenPointsDialog = (employee: User) => {
    setSelectedEmployee(employee);
    setIsPointsDialogOpen(true);
  };

  // Handler para o envio do formulário de xCoins
  const onSubmitPoints = (values: PointsFormValues) => {
    if (!selectedEmployee) return;
    
    addPointsMutation.mutate({
      userId: selectedEmployee.id,
      points: values.points,
      description: values.description,
    });
  };

  // Handler para o envio do formulário de registro
  const onSubmitRegister = (values: RegisterFormValues) => {
    registerMutation.mutate(values);
  };
  
  // Handler para abrir o diálogo de edição de usuário
  const handleOpenEditDialog = (employee: User) => {
    setSelectedEmployee(employee);
    // Preencher o formulário com os dados atuais do funcionário
    editForm.reset({
      username: employee.username,
      email: employee.email,
      displayName: employee.displayName || "",
      unit: employee.unit || "",
      role: employee.role,
      password: "", // Senha em branco para não alterar a senha atual
    });
    setIsEditDialogOpen(true);
  };
  
  // Handler para o envio do formulário de edição
  const onSubmitEdit = (values: EditUserFormValues) => {
    if (!selectedEmployee) return;
    
    // Remover campos vazios para que não sejam enviados para o servidor
    const userData = { ...values };
    if (!userData.password) delete userData.password;
    if (!userData.displayName) delete userData.displayName;
    if (!userData.unit) delete userData.unit;
    
    editUserMutation.mutate({
      id: selectedEmployee.id,
      userData
    });
  };
  
  // Handler para abrir o diálogo de exclusão
  const handleOpenDeleteDialog = (employee: User) => {
    setSelectedEmployee(employee);
    setIsDeleteDialogOpen(true);
  };
  
  // Handler para confirmar a exclusão
  const handleConfirmDelete = () => {
    if (!selectedEmployee) return;
    deleteUserMutation.mutate(selectedEmployee.id);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-10">
          <p className="text-red-500">Erro ao carregar funcionários: {error instanceof Error ? error.message : "Erro desconhecido"}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Gerenciar Funcionários
          </h1>
          <Button onClick={() => setIsRegisterDialogOpen(true)} 
            className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 border-0">
            <UserPlus className="h-4 w-4 mr-2" />
            Adicionar Funcionário
          </Button>
        </div>

        {employees && employees.length > 0 ? (
          <Card className="border-primary/20 overflow-hidden shadow-md">
            <div className="bg-gradient-to-r from-primary to-secondary h-2"></div>
            <CardContent className="p-0">
              <Table>
                <TableCaption>Lista de funcionários da empresa</TableCaption>
                <TableHeader className="bg-primary/5">
                  <TableRow>
                    <TableHead className="text-primary">Nome</TableHead>
                    <TableHead className="text-primary">Email</TableHead>
                    <TableHead className="text-primary">Função</TableHead>
                    <TableHead className="text-primary">xCoins</TableHead>
                    <TableHead className="text-primary">Data de Registro</TableHead>
                    <TableHead className="text-primary">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee, index) => (
                    <TableRow key={employee.id} className={index % 2 === 0 ? "bg-primary/[0.02]" : ""}>
                      <TableCell className="font-medium">{employee.displayName || employee.username}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>
                        <Badge variant={employee.role === UserRoleEnum.ADMIN ? "secondary" : "outline"}
                          className={employee.role === UserRoleEnum.ADMIN ? "" : "border-primary/30 text-primary"}>
                          {employee.role === UserRoleEnum.ADMIN ? "Administrador" : "Funcionário"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center">
                          <Award className="h-4 w-4 mr-1 text-secondary" />
                          <span className="font-medium">{employee.points}</span>
                        </span>
                      </TableCell>
                      <TableCell>
                        {employee.createdAt ? 
                          format(new Date(employee.createdAt), "dd/MM/yyyy", { locale: ptBR }) : 
                          "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleOpenPointsDialog(employee)}
                            className="border-secondary/30 text-secondary hover:bg-secondary/10 hover:text-secondary"
                          >
                            <PlusCircle className="h-4 w-4 mr-1" />
                            Adicionar xCoins
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel className="text-primary">Ações</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleOpenEditDialog(employee)} className="text-primary hover:text-primary">
                                <Pencil className="h-4 w-4 mr-2 text-primary" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleOpenDeleteDialog(employee)}
                                disabled={currentUser?.id === employee.id} // Impedir exclusão do próprio usuário
                                className={currentUser?.id === employee.id ? "text-gray-400" : "text-destructive hover:text-destructive"}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Nenhum funcionário encontrado</CardTitle>
              <CardDescription>
                Cadastre funcionários para que eles possam utilizar o sistema de xCoins.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>

      {/* Dialog para adicionar xCoins */}
      <Dialog open={isPointsDialogOpen} onOpenChange={setIsPointsDialogOpen}>
        <DialogContent className="border-primary/20 overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-secondary h-1 absolute top-0 left-0 right-0"></div>
          <DialogHeader className="pb-2">
            <DialogTitle className="text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent flex items-center">
              <Award className="h-5 w-5 mr-2 text-secondary" />
              Adicionar xCoins
            </DialogTitle>
            <DialogDescription className="text-primary/70">
              Adicione xCoins à conta de <span className="font-medium text-primary">{selectedEmployee?.displayName || selectedEmployee?.username}</span>.
              Atualmente possui <span className="font-medium text-secondary">{selectedEmployee?.points || 0} xCoins</span>.
            </DialogDescription>
          </DialogHeader>

          <Form {...pointsForm}>
            <form onSubmit={pointsForm.handleSubmit(onSubmitPoints)} className="space-y-4">
              <FormField
                control={pointsForm.control}
                name="points"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary font-medium">Quantidade de xCoins</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        min={1} 
                        className="border-primary/20 focus-visible:ring-primary/30"
                      />
                    </FormControl>
                    <FormDescription className="text-primary/60">
                      Número de xCoins a serem adicionados
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={pointsForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary font-medium">Descrição</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Ex: Participação em projeto" 
                        className="border-primary/20 focus-visible:ring-primary/30"
                      />
                    </FormControl>
                    <FormDescription className="text-primary/60">
                      Motivo pelo qual os xCoins estão sendo adicionados
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsPointsDialogOpen(false)}
                  className="border-primary/20 text-primary hover:bg-primary/5"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={addPointsMutation.isPending}
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 border-0"
                >
                  {addPointsMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adicionando...
                    </>
                  ) : (
                    <>
                      <Award className="mr-2 h-4 w-4" />
                      Adicionar xCoins
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog para registrar novo funcionário */}
      <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Funcionário</DialogTitle>
            <DialogDescription>
              Preencha os detalhes abaixo para cadastrar um novo funcionário no sistema.
            </DialogDescription>
          </DialogHeader>

          <Form {...registerForm}>
            <form onSubmit={registerForm.handleSubmit(onSubmitRegister)} className="space-y-4">
              <FormField
                control={registerForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome de usuário</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="nome_usuario" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={registerForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} placeholder="funcionario@exemplo.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={registerForm.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome de exibição (opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome Completo" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={registerForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} placeholder="******" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={registerForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma função" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={UserRoleEnum.EMPLOYEE}>Funcionário</SelectItem>
                        <SelectItem value={UserRoleEnum.ADMIN}>Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsRegisterDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    "Cadastrar Funcionário"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar funcionário */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Funcionário</DialogTitle>
            <DialogDescription>
              Atualize as informações do funcionário {selectedEmployee?.displayName || selectedEmployee?.username}.
              Deixe o campo de senha em branco para manter a senha atual.
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome de usuário</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="nome_usuario" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} placeholder="funcionario@exemplo.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome de exibição (opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome Completo" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade (opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Financeiro, Marketing, etc" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova senha (opcional)</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} placeholder="Deixe em branco para manter a atual" />
                    </FormControl>
                    <FormDescription>
                      Deixe em branco para manter a senha atual
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma função" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={UserRoleEnum.EMPLOYEE}>Funcionário</SelectItem>
                        <SelectItem value={UserRoleEnum.ADMIN}>Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={editUserMutation.isPending}
                >
                  {editUserMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Alterações"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog para confirmar exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Funcionário</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o funcionário 
              {selectedEmployee ? ` ${selectedEmployee.displayName || selectedEmployee.username}` : ''} e
              todos os seus dados do sistema.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <p className="text-destructive font-medium">
              Tem certeza que deseja excluir este funcionário?
            </p>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Sim, excluir"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}