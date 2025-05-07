import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/Layout";
import { PointTransaction } from "@shared/schema";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, TrendingUp, TrendingDown, Award } from "lucide-react";
import DataTableHeader from "@/components/DataTableHeader";

export default function MyPointsPage() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [transactionType, setTransactionType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Buscar histórico de pontos
  const { data: transactions, isLoading, error } = useQuery<PointTransaction[]>({
    queryKey: ["/api/protected/points/history"],
  });

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

  // Filtrar transações por tipo e texto de busca
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    
    // Primeiro filtrar por tipo
    const typeFiltered = transactionType === "all"
      ? transactions
      : transactions.filter(transaction => transaction.transactionType === transactionType);
    
    // Depois filtrar por texto de busca
    if (!searchQuery) {
      return typeFiltered;
    }
    
    const query = searchQuery.toLowerCase();
    return typeFiltered.filter(transaction => 
      // Pesquisa pela descrição
      transaction.description.toLowerCase().includes(query) ||
      // Pesquisa pela data
      (transaction.createdAt && formatDate(transaction.createdAt.toString()).includes(query)) ||
      // Pesquisa pelo tipo
      (transaction.transactionType === "earned" && "recebido".includes(query)) ||
      (transaction.transactionType === "spent" && "gasto".includes(query)) ||
      (transaction.transactionType === "adjusted" && "ajuste".includes(query)) ||
      // Pesquisa por pontos
      transaction.points.toString().includes(query)
    );
  }, [transactions, transactionType, searchQuery]);
  
  // Função para exportar dados para Excel
  const getExportData = () => {
    if (!filteredTransactions) return [];
    
    return filteredTransactions.map(transaction => ({
      'Data': transaction.createdAt ? formatDate(transaction.createdAt.toString()) : 'N/A',
      'Descrição': transaction.description,
      'Tipo': transaction.transactionType === "earned" 
        ? "Recebido" 
        : transaction.transactionType === "spent" 
          ? "Gasto" 
          : "Ajuste",
      'xCoins': transaction.points
    }));
  };

  // Calcular estatísticas
  const calculateStats = () => {
    if (!transactions) return { earned: 0, spent: 0, adjusted: 0 };

    return transactions.reduce(
      (acc, transaction) => {
        if (transaction.transactionType === "earned") {
          acc.earned += transaction.points;
        } else if (transaction.transactionType === "spent") {
          acc.spent += Math.abs(transaction.points);
        } else if (transaction.transactionType === "adjusted") {
          acc.adjusted += transaction.points;
        }
        return acc;
      },
      { earned: 0, spent: 0, adjusted: 0 }
    );
  };

  const stats = calculateStats();

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
          <h2 className="text-lg font-medium">Erro ao carregar histórico de pontos</h2>
          <p className="text-muted-foreground mt-2">
            Ocorreu um erro ao carregar seu histórico de pontos. Por favor, tente novamente mais tarde.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Meus xCoins</h1>
          <p className="text-muted-foreground">
            Visualize seu saldo de xCoins e histórico de transações
          </p>
        </div>
        
        <DataTableHeader 
          title=""
          onSearch={setSearchQuery}
          onExport={getExportData}
          exportFileName="historico-xcoins"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card de saldo atual */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-primary">Saldo Atual</CardTitle>
              <CardDescription>Seus xCoins disponíveis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end">
                <span className="text-3xl font-bold text-primary">{user?.points || 0}</span>
                <span className="text-muted-foreground ml-2 mb-1">xCoins</span>
              </div>
            </CardContent>
          </Card>

          {/* Card de pontos ganhos */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-secondary">Total Ganho</CardTitle>
              <CardDescription>xCoins acumulados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end">
                <span className="text-3xl font-bold text-secondary">{stats.earned}</span>
                <span className="text-muted-foreground ml-2 mb-1">xCoins</span>
              </div>
            </CardContent>
          </Card>

          {/* Card de pontos gastos */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-primary">Total Gasto</CardTitle>
              <CardDescription>xCoins utilizados em trocas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end">
                <span className="text-3xl font-bold text-primary">{stats.spent}</span>
                <span className="text-muted-foreground ml-2 mb-1">xCoins</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <CardTitle>Histórico de Transações</CardTitle>
            <div className="w-full sm:w-48 mt-2 sm:mt-0">
              <Select
                value={transactionType}
                onValueChange={setTransactionType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="earned">xCoins ganhos</SelectItem>
                  <SelectItem value="spent">xCoins gastos</SelectItem>
                  <SelectItem value="adjusted">Ajustes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="py-12 text-center">
                <Award className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">Nenhuma transação encontrada</h3>
                <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                  {transactionType === "all"
                    ? "Você ainda não possui nenhum histórico de xCoins."
                    : `Você ainda não possui nenhuma transação do tipo selecionado.`}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">xCoins</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="whitespace-nowrap">
                          {transaction.createdAt ? formatDate(transaction.createdAt.toString()) : 'N/A'}
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>
                          {transaction.transactionType === "earned" && (
                            <Badge className="bg-green-600 text-white border-0">
                              <TrendingUp className="h-3.5 w-3.5 mr-1" />
                              Recebido
                            </Badge>
                          )}
                          {transaction.transactionType === "spent" && (
                            <Badge className="bg-red-600 text-white border-0">
                              <TrendingDown className="h-3.5 w-3.5 mr-1" />
                              Gasto
                            </Badge>
                          )}
                          {transaction.transactionType === "adjusted" && (
                            <Badge className="bg-gradient-to-r from-primary to-secondary text-white border-0">
                              Ajuste
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <span
                            className={
                              transaction.points > 0
                                ? "text-green-600"
                                : "text-secondary"
                            }
                          >
                            {transaction.points > 0 ? "+" : ""}
                            {transaction.points}
                          </span>
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