import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/Layout";
import { Product } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart, Tag, Package } from "lucide-react";
import DataTableHeader from "@/components/DataTableHeader";

export default function ProductsPage() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  // Buscar produtos
  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Função para redirecionar para a página de checkout
  const openPurchaseDialog = (product: Product) => {
    navigate(`/checkout/${product.id}`);
  };
  
  // Filtrar produtos com base na pesquisa
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    // Filtrar apenas produtos ativos
    const activeProducts = products.filter(product => product.isActive);
    
    if (!searchQuery) {
      return activeProducts;
    }
    
    const query = searchQuery.toLowerCase();
    return activeProducts.filter(product => 
      // Pesquisa pelo nome
      product.name.toLowerCase().includes(query) ||
      // Pesquisa pela descrição
      (product.description?.toLowerCase() || "").includes(query) ||
      // Pesquisa pelo custo de pontos
      product.pointsCost.toString().includes(query)
    );
  }, [products, searchQuery]);
  
  // Função para gerar dados para exportação
  const getExportData = () => {
    if (!filteredProducts) return [];
    
    return filteredProducts.map(product => ({
      ID: product.id,
      Nome: product.name,
      Descrição: product.description || "Sem descrição",
      'Custo (xCoins)': product.pointsCost,
      Estoque: product.stock,
      Status: product.isActive ? "Ativo" : "Inativo"
    }));
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
            Ocorreu um erro ao carregar a lista de produtos. Por favor, tente novamente mais tarde.
          </p>
        </div>
      </Layout>
    );
  }

  // Renderizar lista vazia
  if (!products || products.length === 0) {
    return (
      <Layout>
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-secondary opacity-40" />
          <h2 className="mt-4 text-lg font-medium text-primary">Nenhum produto disponível</h2>
          <p className="mt-2 text-muted-foreground">
            Ainda não há produtos disponíveis para troca por xCoins.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Produtos Disponíveis</h1>
            <p className="text-muted-foreground mt-1">
              Troque seus xCoins (<span className="font-semibold text-secondary">{user?.points || 0}</span> disponíveis) por produtos exclusivos
            </p>
          </div>
        </div>
        
        <DataTableHeader 
          title=""
          onSearch={setSearchQuery}
          onExport={getExportData}
          exportFileName="catalogo-produtos"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden flex flex-col h-full">
              <div className="aspect-square relative bg-muted">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Package className="h-16 w-16 text-secondary opacity-50" />
                  </div>
                )}
                <Badge 
                  className="absolute top-2 right-2 font-medium" 
                  variant="secondary"
                >
                  <Tag className="h-3.5 w-3.5 mr-1" />
                  {product.pointsCost} xCoins
                </Badge>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-primary">{product.name}</CardTitle>
              </CardHeader>
              <CardContent className="pb-2 flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {product.description || 'Sem descrição disponível'}
                </p>
                {product.stock === 1 && (
                  <Badge variant="outline" className="mt-2 bg-destructive text-white border-destructive">
                    Último em estoque
                  </Badge>
                )}
                {product.stock <= 5 && product.stock > 1 && (
                  <Badge variant="outline" className="mt-2 bg-primary text-secondary border-primary">
                    Apenas {product.stock} em estoque
                  </Badge>
                )}
                {product.stock === 0 && (
                  <Badge variant="outline" className="mt-2 bg-destructive text-white border-destructive">
                    Esgotado
                  </Badge>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => openPurchaseDialog(product)}
                  disabled={product.stock === 0 || (user?.points || 0) < product.pointsCost}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Trocar por xCoins
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}