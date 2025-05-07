import { Switch, Route, Redirect } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute, AdminRoute } from "@/lib/protected-route";
import { queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

// Páginas
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import ProductsPage from "@/pages/ProductsPage";
import MyPointsPage from "@/pages/MyPointsPage";
import MyOrdersPage from "@/pages/MyOrdersPage";
import OrderDetailPage from "@/pages/OrderDetailPage";
import CheckoutPage from "@/pages/CheckoutPage";
import Account from "@/pages/Account";
import ProfilePage from "@/pages/ProfilePage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminProductsPage from "@/pages/admin/ProductsPage";
import EmployeesPage from "@/pages/admin/EmployeesPage";
import OrdersPage from "@/pages/admin/OrdersPage";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-background">
            <Switch>
              {/* Rota de autenticação (pública) */}
              <Route path="/auth" component={AuthPage} />
              
              {/* Rotas protegidas (apenas usuários autenticados) */}
              <Route path="/">
                {() => {
                  const { user, isLoading } = useAuth();
                  
                  if (isLoading) {
                    return (
                      <div className="flex items-center justify-center min-h-screen">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    );
                  }
                  
                  if (!user) {
                    return <Redirect to="/auth" />;
                  }
                  
                  // Se for admin, redireciona para o dashboard admin, senão para a página de produtos
                  if (user.role === "admin") {
                    return <Redirect to="/admin" />;
                  } else {
                    return <ProductsPage />;
                  }
                }}
              </Route>
              <ProtectedRoute path="/products" component={ProductsPage} />
              <ProtectedRoute path="/checkout/:id" component={CheckoutPage} />
              <ProtectedRoute path="/my-points" component={MyPointsPage} />
              <ProtectedRoute path="/my-orders" component={MyOrdersPage} />
              <ProtectedRoute path="/my-orders/:id" component={OrderDetailPage} />
              <ProtectedRoute path="/account" component={ProfilePage} />
              
              {/* Rotas administrativas (apenas administradores) */}
              <AdminRoute path="/admin" component={AdminDashboard} />
              <AdminRoute path="/admin/products" component={AdminProductsPage} />
              <AdminRoute path="/admin/employees" component={EmployeesPage} />
              <AdminRoute path="/admin/orders" component={OrdersPage} />
              
              {/* Página não encontrada */}
              <Route component={NotFound} />
            </Switch>
          </div>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
