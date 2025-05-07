import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import Layout from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft, Package, CheckCircle, XCircle } from "lucide-react";

type OrderDetail = {
  order: {
    id: number;
    userId: number;
    totalPoints: number;
    status: "pending" | "completed" | "cancelled";
    createdAt: string;
    updatedAt: string | null;
  };
  items: Array<{
    id: number;
    orderId: number;
    productId: number;
    quantity: number;
    pointsCost: number;
    product: {
      id: number;
      name: string;
      description: string;
      pointsCost: number;
      imageUrl: string | null;
      stock: number;
      isActive: boolean;
    };
  }>;
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = parseInt(id);
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  // Buscar detalhes do pedido
  const {
    data: orderDetail,
    isLoading,
    error,
  } = useQuery<OrderDetail>({
    queryKey: [`/api/protected/orders/${orderId}`]
  });
  
  // Usar useEffect para lidar com erros
  useEffect(() => {
    if (error) {
      toast({
        title: "Erro ao carregar pedido",
        description: error instanceof Error ? error.message : "Não foi possível carregar os detalhes do pedido.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Função para formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Função para obter badge de status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
            <Package className="w-3.5 h-3.5 mr-1" />
            Pendente
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3.5 h-3.5 mr-1" />
            Concluído
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3.5 h-3.5 mr-1" />
            Cancelado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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
  if (error || !orderDetail) {
    return (
      <Layout>
        <div className="container max-w-4xl mx-auto py-6">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/my-orders")}
              className="flex items-center text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para meus pedidos
            </Button>
          </div>
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Pedido não encontrado</CardTitle>
              <CardDescription>
                Não foi possível encontrar os detalhes deste pedido.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button onClick={() => navigate("/my-orders")}>
                Ver meus pedidos
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto py-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/my-orders")}
            className="flex items-center text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para meus pedidos
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Pedido #{orderDetail.order.id}</CardTitle>
                <CardDescription>
                  Realizado em {formatDate(orderDetail.order.createdAt)}
                </CardDescription>
              </div>
              <div>{getStatusBadge(orderDetail.order.status)}</div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3 text-primary">Itens do Pedido</h3>
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
                  {orderDetail.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          {item.product.imageUrl && (
                            <img
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              className="w-10 h-10 object-cover rounded-md"
                            />
                          )}
                          <div>
                            <div>{item.product.name}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[250px]">
                              {item.product.description}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {item.pointsCost.toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        {(item.pointsCost * item.quantity).toLocaleString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Separator />

            <div className="flex flex-col sm:flex-row justify-between">
              <div>
                <h3 className="text-lg font-medium mb-2 text-primary">Resumo do Pedido</h3>
                <p className="text-sm text-muted-foreground">
                  Status atual: {orderDetail.order.status === "pending"
                    ? "Pendente de confirmação"
                    : orderDetail.order.status === "completed"
                      ? "Concluído"
                      : "Cancelado"}
                </p>
              </div>
              <div className="mt-4 sm:mt-0 flex flex-col items-end">
                <div className="text-lg font-medium text-secondary">
                  Total: <span className="font-semibold">{orderDetail.order.totalPoints.toLocaleString("pt-BR")}</span> xCoins
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}