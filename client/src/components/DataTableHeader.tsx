import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Search, X } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface DataTableHeaderProps {
  title: string;
  description?: string;
  onSearch: (query: string) => void;
  onExport: () => any[]; // função que retorna os dados a serem exportados
  exportFileName?: string;
}

export default function DataTableHeader({
  title,
  description,
  onSearch,
  onExport,
  exportFileName = "dados-exportados"
}: DataTableHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    onSearch(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    onSearch("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleExport = () => {
    try {
      const data = onExport();
      
      if (!data || data.length === 0) {
        console.error("Nenhum dado para exportar");
        return;
      }

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Dados");

      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
      saveAs(blob, `${exportFileName}.xlsx`);
    } catch (error) {
      console.error("Erro ao exportar dados:", error);
    }
  };

  return (
    <div className="flex flex-col space-y-4 sm:space-y-6 mb-6">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative w-full sm:w-[350px]">
          <Input
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pr-10"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-10 top-0 h-full flex items-center pr-2"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
          <button
            onClick={handleSearch}
            className="absolute right-0 top-0 h-full flex items-center pr-3"
          >
            <Search className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        
        <Button 
          variant="outline" 
          className="flex gap-2 items-center"
          onClick={handleExport}
        >
          <Download className="h-4 w-4" />
          Exportar Excel
        </Button>
      </div>
    </div>
  );
}