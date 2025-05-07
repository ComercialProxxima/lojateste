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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

// Definição do schema para validação
const profileSchema = z.object({
  displayName: z.string().min(3, "O nome de exibição deve ter pelo menos 3 caracteres").optional().nullable(),
  unit: z.string().optional().nullable(),
  currentPassword: z.string().min(1, "A senha atual é obrigatória"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isRemovingImage, setIsRemovingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Inicialização do formulário
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || "",
      unit: user?.unit || "",
      currentPassword: "",
    },
  });
  
  // Mutação para atualizar o perfil
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Enviando dados:", data);
      const res = await apiRequest("PATCH", "/api/protected/profile", data);
      const result = await res.json();
      console.log("Resposta recebida:", result);
      return result;
    },
    onSuccess: () => {
      // Atualizar cache e notificar o usuário
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso",
      });
      
      // Resetar campos de senha
      form.setValue("currentPassword", "");
    },
    onError: (error: any) => {
      console.error("Erro:", error);
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message || "Verifique sua senha atual e tente novamente",
        variant: "destructive",
      });
    },
  });
  
  // Manipulador para upload de imagem com redimensionamento
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Verificar se o arquivo é uma imagem
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Tipo de arquivo inválido",
          description: "Por favor, selecione uma imagem (JPG, PNG, etc.)",
          variant: "destructive",
        });
        return;
      }
      
      // Redimensionar a imagem antes de armazená-la
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          img.onload = () => {
            // Definir tamanho máximo de 400x400px para avatars
            const MAX_WIDTH = 400;
            const MAX_HEIGHT = 400;
            
            let width = img.width;
            let height = img.height;
            
            // Calcular proporção para redimensionamento
            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }
            
            // Criar canvas e desenhar imagem redimensionada
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              
              // Converter para data URL (qualidade 0.85 para JPEG)
              const imageData = canvas.toDataURL('image/jpeg', 0.85);
              setImageUrl(imageData);
              setIsRemovingImage(false);
              setShowImageDialog(false);
              
              console.log("Imagem redimensionada para " + width + "x" + height);
            }
          };
          img.src = event.target.result as string;
        }
      };
      
      reader.readAsDataURL(file);
    }
  };
  
  // Manipulador para remover imagem
  const handleRemoveImage = () => {
    setImageUrl(null);
    setIsRemovingImage(true);
    setShowImageDialog(false);
  };
  
  // Função para envio do formulário
  const onSubmit = (data: ProfileFormValues) => {
    // Preparar os dados para envio
    const updateData: any = {
      displayName: data.displayName,
      unit: data.unit,
      currentPassword: data.currentPassword,
    };
    
    // Adicionar informações da imagem se necessário
    if (imageUrl) {
      updateData.profileImageUrl = imageUrl;
    } else if (isRemovingImage) {
      updateData.profileImageUrl = null;
    }
    
    // Enviar os dados
    updateProfileMutation.mutate(updateData);
  };
  
  // Exibir carregamento se não houver dados do usuário
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
        <h1 className="text-3xl font-bold mb-6">Perfil do Usuário</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>Atualize suas informações de perfil</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Avatar e informações básicas */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="relative group">
                <Avatar 
                  className="h-24 w-24 cursor-pointer border-2 border-border"
                  onClick={() => setShowImageDialog(true)}
                >
                  {imageUrl ? (
                    <AvatarImage src={imageUrl} alt="Foto de perfil" />
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
            
            {/* Formulário de perfil */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
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
        
        {/* Dialog para gerenciar a foto de perfil */}
        <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Foto de Perfil</DialogTitle>
              <DialogDescription>
                Altere sua foto de perfil ou remova a existente
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-32 w-32">
                  {imageUrl ? (
                    <AvatarImage src={imageUrl} alt="Preview" />
                  ) : user.profileImageUrl && !isRemovingImage ? (
                    <AvatarImage src={user.profileImageUrl} alt="Foto de perfil" />
                  ) : (
                    <AvatarFallback className="bg-primary text-white text-4xl">
                      {user.displayName ? 
                        user.displayName.split(' ').map(name => name[0]).join('').toUpperCase() : 
                        <UserIcon className="h-12 w-12" />
                      }
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Escolher Foto
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={handleRemoveImage}
                    disabled={!user.profileImageUrl && !imageUrl}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remover Foto
                  </Button>
                </div>
              </div>
              
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setShowImageDialog(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}