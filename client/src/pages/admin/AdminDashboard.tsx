import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/Layout";
import { User, Product, Order } from "@shared/schema";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Users, 
  Package, 
  ShoppingCart, 
  Award, 
  ChevronRight,
  Plus
} from "lucide-react";

export default function AdminDashboard() {
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [isAddPointsModalOpen, setIsAddPointsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pointsToAdd, setPointsToAdd] = useState(0);
  const [pointsDescription, setPointsDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Buscar funcionários
  const { data: employees, isLoading: isLoadingEmployees } = useQuery<User[]>({
    queryKey: ["/api/admin/employees"],
  });

  // Buscar produtos
  const { data: products, isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Buscar todos os pedidos usando o endpoint de admin
  const { data: recentOrders, isLoading: isLoadingOrders } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
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

  // Abrir modal para adicionar pontos
  const openAddPointsModal = (user: User) => {
    setSelectedUser(user);
    setPointsToAdd(0);
    setPointsDescription("");
    setIsAddPointsModalOpen(true);
  };

  // Adicionar pontos ao usuário
  const handleAddPoints = async () => {
    if (!selectedUser || pointsToAdd === 0 || !pointsDescription.trim()) return;

    setIsProcessing(true);

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/points`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          points: pointsToAdd,
          description: pointsDescription,
        }),
      });

      if (response.ok) {
        toast({
          title: "Pontos adicionados com sucesso",
          description: `${pointsToAdd} pontos foram adicionados para ${selectedUser.displayName || selectedUser.username}.`,
        });
        
        // Fechar modal e reiniciar busca de funcionários
        setIsAddPointsModalOpen(false);
      } else {
        const error = await response.json();
        throw new Error(error.message || "Erro ao adicionar pontos");
      }
    } catch (error) {
      toast({
        title: "Erro ao adicionar pontos",
        description: error.message || "Ocorreu um erro ao adicionar pontos.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Calcular estatísticas do dashboard
  const stats = {
    totalEmployees: employees?.length || 0,
    totalProducts: products?.length || 0,
    activeProducts: products?.filter(p => p.isActive).length || 0,
    totalOrders: recentOrders?.length || 0,
    pendingOrders: recentOrders?.filter(o => o.status === "pending").length || 0,
  };

  // Verificar se está carregando dados
  const isLoading = isLoadingEmployees || isLoadingProducts || isLoadingOrders;
  
  if (isLoading) {
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard Administrativo</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema de pontos e recompensas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card de funcionários */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Users className="mr-2 h-5 w-5 text-primary" />
              Funcionários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalEmployees}</div>
            <p className="text-muted-foreground text-sm mt-1">
              Total de funcionários
            </p>
          </CardContent>
        </Card>

        {/* Card de produtos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Package className="mr-2 h-5 w-5 text-primary" />
              Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeProducts}/{stats.totalProducts}</div>
            <p className="text-muted-foreground text-sm mt-1">
              Produtos ativos/total
            </p>
          </CardContent>
        </Card>

        {/* Card de pedidos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <ShoppingCart className="mr-2 h-5 w-5 text-primary" />
              Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalOrders}</div>
            <p className="text-muted-foreground text-sm mt-1">
              Total de pedidos
            </p>
          </CardContent>
        </Card>

        {/* Card de pedidos pendentes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <ShoppingCart className="mr-2 h-5 w-5 text-primary" />
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingOrders}</div>
            <p className="text-muted-foreground text-sm mt-1">
              Pedidos aguardando aprovação
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funcionários recentes */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Funcionários</CardTitle>
              <CardDescription>
                Gerenciar pontos dos funcionários
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/admin/employees")}
            >
              Ver todos
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {employees && employees.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Pontos</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.slice(0, 5).map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {employee.displayName || employee.username}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {employee.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Award className="mr-1 h-4 w-4 text-primary" />
                            {employee.points}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAddPointsModal(employee)}
                          >
                            <Plus className="mr-1 h-4 w-4" />
                            Adicionar Pontos
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-6">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">Nenhum funcionário encontrado</h3>
                <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                  Não há funcionários registrados no sistema.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pedidos recentes */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Pedidos Recentes</CardTitle>
              <CardDescription>
                Últimos pedidos realizados
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/admin/orders")}
            >
              Ver todos
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentOrders && recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Pontos</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.slice(0, 5).map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>#{order.id}</TableCell>
                        <TableCell>
                          {formatDate(order.createdAt.toString())}
                        </TableCell>
                        <TableCell>{order.totalPoints}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-6">
                <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">Nenhum pedido encontrado</h3>
                <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                  Não há pedidos registrados no sistema.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal para adicionar pontos */}
      {selectedUser && (
        <Dialog open={isAddPointsModalOpen} onOpenChange={setIsAddPointsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Pontos</DialogTitle>
              <DialogDescription>
                Adicione pontos para {selectedUser.displayName || selectedUser.username}. 
                O usuário atualmente possui {selectedUser.points} pontos.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="points">Quantidade de Pontos</Label>
                <Input
                  id="points"
                  type="number"
                  value={pointsToAdd}
                  onChange={(e) => setPointsToAdd(parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={pointsDescription}
                  onChange={(e) => setPointsDescription(e.target.value)}
                  placeholder="Motivo da adição de pontos"
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsAddPointsModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleAddPoints} 
                disabled={pointsToAdd === 0 || !pointsDescription.trim() || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Adicionar Pontos"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Layout>
  );
}