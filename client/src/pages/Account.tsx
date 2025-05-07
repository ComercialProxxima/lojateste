import { useState, useRef, ChangeEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import Layout from "@/components/Layout";
import { Loader2, User as UserIcon, Upload, Trash2, Camera } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const profileSchema = z.object({
  displayName: z.string().min(3, "O nome de exibição deve ter pelo menos 3 caracteres").optional().nullable(),
  unit: z.string().optional().nullable(),
  profileImageUrl: z.string().optional().nullable(),
  currentPassword: z.string().min(1, "Senha atual é obrigatória para alterações"),
  newPassword: z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres").optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.newPassword && !data.confirmPassword) return false;
  if (!data.newPassword && data.confirmPassword) return false;
  if (data.newPassword && data.confirmPassword && data.newPassword !== data.confirmPassword) return false;
  return true;
}, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"]
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Account() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || "",
      unit: user?.unit || "",
      profileImageUrl: user?.profileImageUrl || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      console.log("Enviando dados para o servidor:", data);
      try {
        const res = await apiRequest("PATCH", "/api/protected/profile", data);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Erro ao atualizar o perfil");
        }
        return await res.json();
      } catch (error) {
        console.error("Erro na requisição:", error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log("Perfil atualizado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });
      form.reset({
        ...form.getValues(),
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setImagePreview(null);
      setIsRemoving(false);
    },
    onError: (error: any) => {
      console.error("Erro completo:", error);
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message || "Ocorreu um erro ao atualizar seu perfil. Verifique sua senha atual.",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: ProfileFormValues) => {
    console.log("Formulário enviado com dados:", data);
    
    // Preparar os dados a serem enviados
    const dataToSend = {
      displayName: data.displayName,
      unit: data.unit,
      currentPassword: data.currentPassword,
      newPassword: data.newPassword || undefined,
      confirmPassword: data.confirmPassword || undefined,
    };
    
    // Se o usuário fez upload de uma imagem, incluímos o preview no envio
    if (imagePreview) {
      dataToSend.profileImageUrl = imagePreview;
    }
    
    // Se o usuário está removendo a imagem
    if (isRemoving) {
      dataToSend.profileImageUrl = null;
    }
    
    console.log("Dados preparados para envio:", {
      ...dataToSend,
      currentPassword: dataToSend.currentPassword ? "[senha]" : undefined,
      newPassword: dataToSend.newPassword ? "[senha]" : undefined,
      confirmPassword: dataToSend.confirmPassword ? "[senha]" : undefined,
      profileImageUrl: dataToSend.profileImageUrl ? "[imagem]" : null
    });
    
    // Mostrar toast antes de enviar
    toast({
      title: "Processando...",
      description: "Enviando as alterações para o servidor",
    });
    
    // Verificar se temos todos os campos necessários
    if (!dataToSend.currentPassword) {
      toast({
        title: "Campo obrigatório",
        description: "A senha atual é necessária para salvar as alterações",
        variant: "destructive",
      });
      return;
    }
    
    // Enviar dados
    updateProfileMutation.mutate(dataToSend);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imagePreviewUrl = event.target?.result as string;
        setImagePreview(imagePreviewUrl);
        setShowImageDialog(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setIsRemoving(true);
    form.setValue("profileImageUrl", null);
    setShowImageDialog(false);
  };

  const handleImageClick = () => {
    setShowImageDialog(true);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  if (!user) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mx-auto py-6 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Perfil de Usuário</h1>
        
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="info">Informações Pessoais</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
          </TabsList>
          
          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Conta</CardTitle>
                <CardDescription>Gerencie suas informações pessoais</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="relative group">
                    <Avatar 
                      className="h-24 w-24 cursor-pointer border-2 border-border"
                      onClick={handleImageClick}
                    >
                      {imagePreview ? (
                        <AvatarImage src={imagePreview} alt="Foto de perfil" />
                      ) : user.profileImageUrl ? (
                        <AvatarImage src={user.profileImageUrl} alt="Foto de perfil" />
                      ) : (
                        <AvatarFallback className="bg-primary text-white text-2xl">
                          {user.displayName ? 
                            user.displayName.split(' ').map(name => name[0]).join('').toUpperCase() : 
                            <UserIcon className="h-8 w-8" />
                          }
                        </AvatarFallback>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="h-6 w-6 text-white" />
                      </div>
                    </Avatar>
                  </div>

                  <div>
                    <h3 className="text-xl font-medium">{user.displayName || user.username}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {user.role === "admin" ? "Administrador" : "Funcionário"}
                    </p>
                    {user.unit && (
                      <p className="text-sm mt-2 bg-muted px-2 py-1 rounded-md inline-block">
                        Unidade: {user.unit}
                      </p>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="text-base font-medium">Informações de Perfil</h4>
                      
                      <FormField
                        control={form.control}
                        name="displayName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome de Exibição</FormLabel>
                            <FormControl>
                              <Input placeholder="Seu nome completo" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormDescription>
                              Este nome será exibido em todas as áreas do sistema
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unidade</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Matriz, Filial SP, Departamento RH" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormDescription>
                              Unidade ou departamento onde você trabalha
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Nome de Usuário</p>
                          <p className="text-sm text-muted-foreground">{user.username}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Email</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha Atual</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormDescription>
                              Necessária para confirmar as alterações
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          "Salvar Alterações"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Segurança da Conta</CardTitle>
                <CardDescription>Gerencie sua senha e segurança da conta</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="text-base font-medium">Alterar Senha</h4>
                      
                      <FormField
                        control={form.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha Atual</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nova Senha</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormDescription>
                                Mínimo de 6 caracteres
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirmar Nova Senha</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          "Atualizar Senha"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Input de arquivo oculto */}
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        
        {/* Dialog para gerenciar a foto de perfil */}
        <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Foto de Perfil</DialogTitle>
              <DialogDescription>
                Carregue uma nova foto ou remova a existente.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col items-center justify-center gap-4 py-4">
              <Avatar className="h-24 w-24 mx-auto">
                {imagePreview ? (
                  <AvatarImage src={imagePreview} alt="Preview" />
                ) : user.profileImageUrl ? (
                  <AvatarImage src={user.profileImageUrl} alt="Foto atual" />
                ) : (
                  <AvatarFallback className="bg-primary text-white text-2xl">
                    {user.displayName ? 
                      user.displayName.split(' ').map(name => name[0]).join('').toUpperCase() : 
                      <UserIcon className="h-8 w-8" />
                    }
                  </AvatarFallback>
                )}
              </Avatar>
              
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  onClick={triggerFileInput} 
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Carregar Foto
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleRemoveImage}
                  className="flex items-center gap-2 text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Remover Foto
                </Button>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowImageDialog(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}