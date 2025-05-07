import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/Layout";
import { Order } from "@shared/schema";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ShoppingCart, ChevronRight } from "lucide-react";
import DataTableHeader from "@/components/DataTableHeader";

export default function MyOrdersPage() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Buscar pedidos do usuário
  const { data: orders, isLoading, error } = useQuery<Order[]>({
    queryKey: ["/api/protected/orders"],
  });

  // Função para formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  // Filtrar pedidos por status e texto de busca
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    
    // Primeiro filtrar por status
    const statusFiltered = statusFilter === "all" 
      ? orders 
      : orders.filter(order => order.status === statusFilter);
    
    // Depois filtrar por texto de busca
    if (!searchQuery) {
      return statusFiltered;
    }
    
    const query = searchQuery.toLowerCase();
    return statusFiltered.filter(order => 
      // Pesquisa pelo ID
      order.id.toString().includes(query) ||
      // Pesquisa pela data
      (order.createdAt && formatDate(order.createdAt.toString()).includes(query)) ||
      // Pesquisa pelo status
      (order.status === "pending" && "pendente".includes(query)) ||
      (order.status === "completed" && "concluído".includes(query)) ||
      (order.status === "cancelled" && "cancelado".includes(query)) ||
      // Pesquisa por pontos
      order.totalPoints.toString().includes(query)
    );
  }, [orders, statusFilter, searchQuery]);
  
  // Função para exportar dados para Excel
  const getExportData = () => {
    if (!filteredOrders) return [];
    
    return filteredOrders.map(order => ({
      'Nº do Pedido': order.id,
      'Data': order.createdAt ? formatDate(order.createdAt.toString()) : 'N/A',
      'xCoins': order.totalPoints,
      'Status': order.status === "pending" 
        ? "Pendente" 
        : order.status === "completed" 
          ? "Concluído" 
          : "Cancelado"
    }));
  };

  // Função para obter a cor do badge de status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
            Pendente
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            Concluído
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            Cancelado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Navegar para detalhes do pedido
  const handleViewOrderDetails = (orderId: number) => {
    navigate(`/my-orders/${orderId}`);
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
          <h2 className="text-lg font-medium">Erro ao carregar pedidos</h2>
          <p className="text-muted-foreground mt-2">
            Ocorreu um erro ao carregar seus pedidos. Por favor, tente novamente mais tarde.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Meus Pedidos</h1>
          <p className="text-muted-foreground">
            Visualize seu histórico de pedidos e acompanhe o status
          </p>
        </div>
        
        <DataTableHeader 
          title=""
          onSearch={setSearchQuery}
          onExport={getExportData}
          exportFileName="meus-pedidos"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total de pedidos */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total de Pedidos</CardTitle>
              <CardDescription>Todos os pedidos realizados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{orders?.length || 0}</div>
            </CardContent>
          </Card>

          {/* Pedidos pendentes */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Pedidos Pendentes</CardTitle>
              <CardDescription>Aguardando processamento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {orders?.filter((order) => order.status === "pending").length || 0}
              </div>
            </CardContent>
          </Card>

          {/* xCoins gastos */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">xCoins Utilizados</CardTitle>
              <CardDescription>Total de xCoins utilizados em pedidos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {orders?.reduce((sum, order) => sum + order.totalPoints, 0) || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <CardTitle>Histórico de Pedidos</CardTitle>
            <div className="w-full sm:w-48 mt-2 sm:mt-0">
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="completed">Concluídos</SelectItem>
                  <SelectItem value="cancelled">Cancelados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <div className="py-12 text-center">
                <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">Nenhum pedido encontrado</h3>
                <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                  {statusFilter === "all"
                    ? "Você ainda não realizou nenhum pedido."
                    : `Você não possui pedidos com o status "${statusFilter}".`}
                </p>
                <Button 
                  className="mt-4" 
                  onClick={() => navigate("/")}
                >
                  Ver Produtos Disponíveis
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº do Pedido</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>xCoins</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>#{order.id}</TableCell>
                        <TableCell>{order.createdAt ? formatDate(order.createdAt.toString()) : 'N/A'}</TableCell>
                        <TableCell>{order.totalPoints}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewOrderDetails(order.id)}
                            className="h-8 px-2 lg:px-3"
                          >
                            Detalhes
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}