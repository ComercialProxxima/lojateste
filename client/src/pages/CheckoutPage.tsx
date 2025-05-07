import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@shared/schema";
import Layout from "@/components/Layout";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Minus,
  ShoppingCart,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const productId = parseInt(id);
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [isOrderComplete, setIsOrderComplete] = useState(false);
  const [newOrderId, setNewOrderId] = useState<number | null>(null);

  // Buscar produto
  const {
    data: product,
    isLoading,
    error,
  } = useQuery<Product>({
    queryKey: [`/api/products/${productId}`]
  });
  
  // Usar useEffect para lidar com erros
  useEffect(() => {
    if (error) {
      toast({
        title: "Erro ao carregar produto",
        description: error instanceof Error ? error.message : "Não foi possível carregar os detalhes do produto.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Mutação para criar o pedido
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/protected/orders", {
        items: [
          {
            productId,
            quantity,
          },
        ],
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Pedido realizado!",
        description: "Seu pedido foi realizado com sucesso.",
      });
      
      // Atualizar o cache de pedidos
      queryClient.invalidateQueries({ queryKey: ["/api/protected/orders"] });
      
      // Atualizar o cache de pontos
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/protected/points/history"] });
      
      setIsOrderComplete(true);
      setNewOrderId(data.order.id);
    },
    onError: (error: Error) => {
      let errorMsg = "Ocorreu um erro ao processar seu pedido.";
      
      // Verificar se a mensagem de erro contém informações sobre pontos insuficientes
      if (error.message.includes("xCoins insuficientes")) {
        errorMsg = "Você não tem xCoins suficientes para este pedido.";
      } else if (error.message.includes("Estoque insuficiente")) {
        errorMsg = "Estoque insuficiente para este produto.";
      }
      
      toast({
        title: "Erro no pedido",
        description: errorMsg,
        variant: "destructive",
      });
    },
  });

  // Função para incrementar quantidade
  const incrementQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  // Função para decrementar quantidade
  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  // Função para finalizar pedido
  const handlePlaceOrder = () => {
    createOrderMutation.mutate();
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

  // Renderizar erro
  if (error || !product) {
    return (
      <Layout>
        <div className="container max-w-4xl mx-auto py-6">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="flex items-center text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para produtos
            </Button>
          </div>
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Produto não encontrado</CardTitle>
              <CardDescription>
                Não foi possível encontrar os detalhes deste produto.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button onClick={() => navigate("/")}>
                Ver produtos disponíveis
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Se o pedido foi concluído com sucesso
  if (isOrderComplete && newOrderId) {
    return (
      <Layout>
        <div className="container max-w-4xl mx-auto py-6">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl">Pedido realizado com sucesso!</CardTitle>
              <CardDescription className="text-base mt-2">
                Seu pedido foi registrado e será processado em breve.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-md">
                <div className="font-medium">Resumo do pedido:</div>
                <div className="mt-2">
                  <div className="flex justify-between py-1 text-sm">
                    <span>Produto:</span>
                    <span className="font-medium">{product.name}</span>
                  </div>
                  <div className="flex justify-between py-1 text-sm">
                    <span>Quantidade:</span>
                    <span className="font-medium">{quantity}</span>
                  </div>
                  <div className="flex justify-between py-1 text-sm">
                    <span>Total:</span>
                    <span className="font-medium">{(product.pointsCost * quantity).toLocaleString("pt-BR")} xCoins</span>
                  </div>
                  <div className="flex justify-between py-1 text-sm">
                    <span>Número do pedido:</span>
                    <span className="font-medium">#{newOrderId}</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => navigate(`/my-orders/${newOrderId}`)}>
                Ver detalhes do pedido
              </Button>
              <Button variant="outline" onClick={() => navigate("/my-orders")}>
                Ver todos os pedidos
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Layout>
    );
  }

  // Calcular total de xCoins
  const totalPoints = product.pointsCost * quantity;

  // Verificar se o usuário tem xCoins suficientes
  const hasEnoughPoints = user?.points !== undefined && user.points >= totalPoints;

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto py-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="flex items-center text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para produtos
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Finalizar pedido</CardTitle>
            <CardDescription>
              Revise seu pedido antes de confirmar
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3 text-primary">Produto selecionado</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-center">Quantidade</TableHead>
                    <TableHead className="text-right">xCoins (un.)</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded-md"
                          />
                        )}
                        <div>
                          <div>{product.name}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[250px]">
                            {product.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={decrementQuantity}
                          disabled={quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          max={product.stock}
                          className="w-16 mx-2 text-center"
                          value={quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val) && val >= 1 && val <= product.stock) {
                              setQuantity(val);
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={incrementQuantity}
                          disabled={quantity >= product.stock}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {product.pointsCost.toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      {totalPoints.toLocaleString("pt-BR")}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <Separator />

            <div className="flex flex-col sm:flex-row justify-between">
              <div>
                <h3 className="text-lg font-medium mb-2 text-primary">Resumo</h3>
                <p className="text-sm text-muted-foreground">
                  xCoins disponíveis: <span className="text-primary font-medium">{user?.points?.toLocaleString("pt-BR") || 0}</span>
                </p>
              </div>
              <div className="mt-4 sm:mt-0 flex flex-col items-end">
                <div className="text-lg font-medium text-secondary">
                  Total: <span className="font-semibold">{totalPoints.toLocaleString("pt-BR")}</span> xCoins
                </div>
                <p className="text-sm text-muted-foreground">
                  Restante após pedido: {user && (user.points - totalPoints > 0 ? (user.points - totalPoints).toLocaleString("pt-BR") : 0)} xCoins
                </p>
              </div>
            </div>

            {!hasEnoughPoints && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>xCoins insuficientes</AlertTitle>
                <AlertDescription>
                  Você não possui xCoins suficientes para fazer este pedido.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>

          <CardFooter className="flex justify-end">
            <Button
              onClick={handlePlaceOrder}
              disabled={
                createOrderMutation.isPending ||
                !hasEnoughPoints ||
                quantity < 1 ||
                quantity > product.stock
              }
              className="px-6"
            >
              {createOrderMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Finalizar Pedido
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}