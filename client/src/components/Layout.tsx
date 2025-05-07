import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      
      <div className={`flex flex-col flex-1 ${isMobile ? 'w-full' : ''}`}>
        <main className="flex-grow">
          <div className="p-6 md:p-8">
            {children}
          </div>
        </main>
        
        <footer className="py-4 px-6 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Proxxima Store - Sistema de recompensas
            </p>
            <div className="mt-2 md:mt-0 text-xs text-muted-foreground">
              Desenvolvido para gerenciamento de pontos e produtos
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}