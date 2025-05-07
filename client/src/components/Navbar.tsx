import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  ShoppingCart, 
  Menu, 
  User, 
  LogOut, 
  ChevronDown,
  LayoutDashboard,
  Users,
  Clock,
  Award
} from "lucide-react";

export default function Navbar() {
  const [location, navigate] = useLocation();
  const { user, isAdmin, logoutMutation } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Função para gerar as iniciais do nome
  const getInitials = () => {
    if (!user?.displayName) return user?.username.charAt(0).toUpperCase() || "U";
    
    const nameParts = user.displayName.split(" ");
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  // Função para realizar logout
  const handleLogout = () => {
    logoutMutation.mutate();
    navigate("/auth");
  };

  return (
    <nav className="border-b py-3">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo e nome da aplicação */}
        <div className="flex items-center space-x-2">
          <Link href={isAdmin ? "/admin" : "/"}>
            <div className="flex items-center space-x-2 cursor-pointer">
              <Package className="h-6 w-6 text-secondary" /> {/* Rosa #E6007D */}
              <span className="font-bold text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Proxxima Store</span> {/* Gradiente do azul #2C2C83 para rosa #E6007D */}
            </div>
          </Link>
          {isAdmin && (
            <Badge variant="secondary" className="ml-2">
              Administrador
            </Badge>
          )}
        </div>

        {/* Menu para desktop */}
        <div className="hidden md:flex items-center space-x-6">
          <Link href={isAdmin ? "/admin" : "/"}>
            <div className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
              location === "/" || (isAdmin && location === "/admin") ? "text-primary" : "text-muted-foreground"
            }`}>
              {isAdmin ? "Dashboard" : "Produtos"}
            </div>
          </Link>
          
          <Link href="/my-points">
            <div className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
              location === "/my-points" ? "text-primary" : "text-muted-foreground"
            }`}>
              Meus Pontos
            </div>
          </Link>
          
          <Link href="/my-orders">
            <div className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
              location === "/my-orders" ? "text-primary" : "text-muted-foreground"
            }`}>
              Meus Pedidos
            </div>
          </Link>
          
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-1 px-2">
                  Admin
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Área Administrativa</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/admin")}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/admin/products")}>
                  <Package className="mr-2 h-4 w-4" />
                  <span>Produtos</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/admin/employees")}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>Funcionários</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/admin/orders")}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  <span>Pedidos</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  {user?.profileImageUrl ? (
                    <AvatarImage src={user.profileImageUrl} alt="Foto de perfil" />
                  ) : (
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  )}
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/account")}>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/my-points")}>
                <Award className="mr-2 h-4 w-4" />
                <span>Pontos: {user?.points || 0}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/my-orders")}>
                <Clock className="mr-2 h-4 w-4" />
                <span>Histórico de Pedidos</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Menu para mobile */}
        <div className="md:hidden">
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Proxxima Store</SheetTitle>
              </SheetHeader>
              <div className="py-4 space-y-4">
                <div className="flex items-center space-x-2 mb-6">
                  <Avatar>
                    {user?.profileImageUrl ? (
                      <AvatarImage src={user.profileImageUrl} alt="Foto de perfil" />
                    ) : (
                      <AvatarFallback>{getInitials()}</AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{user?.displayName || user?.username}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                    <p className="text-xs font-medium mt-1">xCoins: {user?.points || 0}</p>
                    {user?.unit && (
                      <p className="text-xs bg-muted px-1 py-0.5 mt-1 rounded-sm inline-block">
                        {user.unit}
                      </p>
                    )}
                  </div>
                </div>
                
                <nav className="flex flex-col space-y-3">
                  <Link href={isAdmin ? "/admin" : "/"}>
                    <div className="flex items-center py-2 px-1 rounded-md hover:bg-primary/10 cursor-pointer" onClick={() => setIsMenuOpen(false)}>
                      <Package className="mr-2 h-5 w-5 text-secondary" />
                      {isAdmin ? "Dashboard" : "Produtos"}
                    </div>
                  </Link>
                  
                  <Link href="/my-points">
                    <div className="flex items-center py-2 px-1 rounded-md hover:bg-primary/10 cursor-pointer" onClick={() => setIsMenuOpen(false)}>
                      <Award className="mr-2 h-5 w-5 text-secondary" />
                      Meus Pontos
                    </div>
                  </Link>
                  
                  <Link href="/my-orders">
                    <div className="flex items-center py-2 px-1 rounded-md hover:bg-primary/10 cursor-pointer" onClick={() => setIsMenuOpen(false)}>
                      <ShoppingCart className="mr-2 h-5 w-5 text-secondary" />
                      Meus Pedidos
                    </div>
                  </Link>
                  
                  <Link href="/account">
                    <div className="flex items-center py-2 px-1 rounded-md hover:bg-primary/10 cursor-pointer" onClick={() => setIsMenuOpen(false)}>
                      <User className="mr-2 h-5 w-5 text-secondary" />
                      Meu Perfil
                    </div>
                  </Link>
                  
                  {isAdmin && (
                    <>
                      <div className="pt-2 border-t">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Administração</p>
                      </div>
                      
                      <Link href="/admin">
                        <div className="flex items-center py-2 px-1 rounded-md hover:bg-primary/10 cursor-pointer" onClick={() => setIsMenuOpen(false)}>
                          <LayoutDashboard className="mr-2 h-5 w-5 text-primary" />
                          Dashboard
                        </div>
                      </Link>
                      
                      <Link href="/admin/products">
                        <div className="flex items-center py-2 px-1 rounded-md hover:bg-primary/10 cursor-pointer" onClick={() => setIsMenuOpen(false)}>
                          <Package className="mr-2 h-5 w-5 text-primary" />
                          Gerenciar Produtos
                        </div>
                      </Link>
                      
                      <Link href="/admin/employees">
                        <div className="flex items-center py-2 px-1 rounded-md hover:bg-primary/10 cursor-pointer" onClick={() => setIsMenuOpen(false)}>
                          <Users className="mr-2 h-5 w-5 text-primary" />
                          Gerenciar Funcionários
                        </div>
                      </Link>
                      
                      <Link href="/admin/orders">
                        <div className="flex items-center py-2 px-1 rounded-md hover:bg-primary/10 cursor-pointer" onClick={() => setIsMenuOpen(false)}>
                          <ShoppingCart className="mr-2 h-5 w-5 text-primary" />
                          Gerenciar Pedidos
                        </div>
                      </Link>
                    </>
                  )}
                </nav>
                
                <div className="pt-4 border-t">
                  <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                    <LogOut className="mr-2 h-5 w-5" />
                    Sair
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}