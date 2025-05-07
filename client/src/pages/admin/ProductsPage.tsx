import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { Product } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Image as ImageIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Package, Plus, Pencil, Trash2 } from "lucide-react";

// Schema para validação do formulário de produto
const productSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
  pointsCost: z.coerce.number().int().positive("O custo deve ser um número positivo"),
  stock: z.coerce.number().int().nonnegative("O estoque não pode ser negativo"),
  isActive: z.boolean().default(true),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function AdminProductsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Buscar produtos
  const {
    data: products,
    isLoading,
    error,
  } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Form para criar/editar produto
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      pointsCost: 100,
      stock: 10,
      isActive: true,
    },
  });

  // Mutation para criar produto
  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      // Se houver uma imagem, usar FormData para envio multipart
      if (selectedImage) {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('description', data.description || '');
        formData.append('pointsCost', data.pointsCost.toString());
        formData.append('stock', data.stock.toString());
        formData.append('isActive', data.isActive.toString());
        formData.append('image', selectedImage);
        
        // Fazer solicitação POST com FormData
        const res = await fetch('/api/admin/products', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Erro ao criar produto');
        }
        
        return await res.json();
      } else {
        // Sem imagem, usar solicitação normal
        const res = await apiRequest("POST", "/api/admin/products", data);
        return await res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsCreateDialogOpen(false);
      form.reset();
      setSelectedImage(null);
      setImagePreview(null);
      toast({
        title: "Produto criado",
        description: "O produto foi criado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar produto",
        description: error.message || "Ocorreu um erro ao criar o produto.",
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar produto
  const updateProductMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: ProductFormData;
    }) => {
      // Se houver uma imagem, usar FormData para envio multipart
      if (selectedImage) {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('description', data.description || '');
        formData.append('pointsCost', data.pointsCost.toString());
        formData.append('stock', data.stock.toString());
        formData.append('isActive', data.isActive.toString());
        formData.append('image', selectedImage);
        
        // Fazer solicitação PATCH com FormData
        const res = await fetch(`/api/admin/products/${id}`, {
          method: 'PATCH',
          body: formData,
          credentials: 'include'
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Erro ao atualizar produto');
        }
        
        return await res.json();
      } else {
        // Sem imagem, usar solicitação normal
        const res = await apiRequest("PATCH", `/api/admin/products/${id}`, data);
        return await res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsEditDialogOpen(false);
      setSelectedProduct(null);
      setSelectedImage(null);
      setImagePreview(null);
      toast({
        title: "Produto atualizado",
        description: "O produto foi atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar produto",
        description: error.message || "Ocorreu um erro ao atualizar o produto.",
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir produto
  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);
      toast({
        title: "Produto excluído",
        description: "O produto foi excluído com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir produto",
        description: error.message || "Ocorreu um erro ao excluir o produto.",
        variant: "destructive",
      });
    },
  });

  // Abrir modal de edição e preencher o formulário
  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    // Limpar imagem prévia, vamos usar a imageUrl do produto se existir
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Preencher o formulário com dados do produto
    form.reset({
      name: product.name,
      description: product.description || "",
      pointsCost: product.pointsCost,
      stock: product.stock,
      isActive: product.isActive,
    });
    
    setIsEditDialogOpen(true);
  };

  // Abrir modal de exclusão
  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  // Handler para manipular a seleção de imagem
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validar se é uma imagem
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem válida.",
        variant: "destructive",
      });
      return;
    }
    
    // Limitar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo permitido é 5MB.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedImage(file);
    
    // Criar preview da imagem
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // Handler para limpar a imagem selecionada
  const handleClearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handler para criar produto
  const onCreateSubmit = (data: ProductFormData) => {
    createProductMutation.mutate(data);
  };

  // Handler para atualizar produto
  const onEditSubmit = (data: ProductFormData) => {
    if (!selectedProduct) return;
    updateProductMutation.mutate({ id: selectedProduct.id, data });
  };

  // Handler para excluir produto
  const handleConfirmDelete = () => {
    if (!selectedProduct) return;
    deleteProductMutation.mutate(selectedProduct.id);
  };

  // Renderizar estado de carregamento
  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Renderizar estado de erro
  if (error) {
    return (
      <Layout>
        <div className="text-center">
          <h2 className="text-lg font-medium">Erro ao carregar produtos</h2>
          <p className="text-muted-foreground mt-2">
            Ocorreu um erro ao carregar a lista de produtos. Por favor, tente
            novamente mais tarde.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gerenciar Produtos</h1>
          <p className="text-muted-foreground">
            Adicione, edite ou remova produtos disponíveis para troca
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Lista de Produtos</CardTitle>
          <CardDescription>
            Total de {products?.length || 0} produtos cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!products || products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">
                Nenhum produto encontrado
              </h3>
              <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                Você ainda não cadastrou nenhum produto no sistema. Clique no
                botão "Novo Produto" para adicionar o primeiro.
              </p>
              <Button
                className="mt-4"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Produto
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Pontos</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {product.description || "Sem descrição"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{product.pointsCost}</TableCell>
                      <TableCell>{product.stock}</TableCell>
                      <TableCell>
                        {product.isActive ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            Ativo
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                            Inativo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only md:not-sr-only md:ml-2">
                              Editar
                            </span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteProduct(product)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only md:not-sr-only md:ml-2">
                              Excluir
                            </span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para adicionar produto */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Produto</DialogTitle>
            <DialogDescription>
              Preencha os detalhes do produto que será disponibilizado para
              troca.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onCreateSubmit)}
              className="space-y-4 overflow-y-auto max-h-[60vh] pr-1"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Produto</FormLabel>
                    <FormControl>
                      <Input placeholder="Camiseta Corporativa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Uma breve descrição do produto..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pointsCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custo em Pontos</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estoque</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Ativo</FormLabel>
                      <FormDescription>
                        Disponibilizar produto para troca.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              {/* Upload de imagem */}
              <div className="space-y-3">
                <FormLabel>Imagem do Produto</FormLabel>
                <div className="grid gap-4">
                  {imagePreview ? (
                    <div className="relative rounded-md overflow-hidden border aspect-square w-full max-w-[300px] mx-auto">
                      <img 
                        src={imagePreview} 
                        alt="Preview da imagem"
                        className="object-cover w-full h-full"
                      />
                      <Button 
                        type="button"
                        variant="destructive" 
                        size="sm"
                        className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full" 
                        onClick={handleClearImage}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="border-2 border-dashed rounded-md flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:border-primary/50 transition-colors max-w-[300px] mx-auto aspect-square"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                      <div className="text-muted-foreground mb-1">
                        Arraste e solte ou clique para escolher uma imagem
                      </div>
                      <div className="text-xs text-muted-foreground">
                        SVG, PNG, JPG ou GIF (máx. 5MB)
                      </div>
                    </div>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageSelect}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createProductMutation.isPending}
                >
                  {createProductMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar Produto"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal para editar produto */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
            <DialogDescription>
              Atualize as informações do produto.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onEditSubmit)}
              className="space-y-4 overflow-y-auto max-h-[60vh] pr-1"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Produto</FormLabel>
                    <FormControl>
                      <Input placeholder="Camiseta Corporativa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Uma breve descrição do produto..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pointsCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custo em Pontos</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estoque</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Ativo</FormLabel>
                      <FormDescription>
                        Disponibilizar produto para troca.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              {/* Upload de imagem */}
              <div className="space-y-3">
                <FormLabel>Imagem do Produto</FormLabel>
                <div className="grid gap-4">
                  {imagePreview ? (
                    <div className="relative rounded-md overflow-hidden border aspect-square w-full max-w-[300px] mx-auto">
                      <img 
                        src={imagePreview} 
                        alt="Preview da imagem"
                        className="object-cover w-full h-full"
                      />
                      <Button 
                        type="button"
                        variant="destructive" 
                        size="sm"
                        className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full" 
                        onClick={handleClearImage}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : selectedProduct?.imageUrl ? (
                    <div className="relative rounded-md overflow-hidden border aspect-square w-full max-w-[300px] mx-auto">
                      <img 
                        src={selectedProduct.imageUrl} 
                        alt={selectedProduct.name}
                        className="object-cover w-full h-full"
                      />
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm"
                        className="absolute bottom-2 right-2 bg-white/80 hover:bg-white" 
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Alterar
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="border-2 border-dashed rounded-md flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:border-primary/50 transition-colors max-w-[300px] mx-auto aspect-square"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                      <div className="text-muted-foreground mb-1">
                        Arraste e solte ou clique para escolher uma imagem
                      </div>
                      <div className="text-xs text-muted-foreground">
                        SVG, PNG, JPG ou GIF (máx. 5MB)
                      </div>
                    </div>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageSelect}
                  />
                </div>
              </div>

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
                  disabled={updateProductMutation.isPending}
                >
                  {updateProductMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    "Atualizar Produto"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal para confirmar exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja excluir o produto "
              {selectedProduct?.name}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteProductMutation.isPending}
            >
              {deleteProductMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir Produto"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}