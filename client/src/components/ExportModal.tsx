import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatTimestamp } from "@/lib/utils";

interface ExportModalProps {
  onClose: () => void;
  transcript?: {
    id: number;
    title: string;
    summary: string;
  };
  lines?: {
    id: number;
    timestamp: number;
    speaker: string;
    content: string;
    isActionItem: boolean;
    actionAssignee: string | null;
    isCompleted: boolean;
  }[];
  activeTab: "summary" | "full" | "actions";
}

const ExportModal = ({ onClose, transcript, lines, activeTab }: ExportModalProps) => {
  const { toast } = useToast();
  const [format, setFormat] = useState("txt");
  const [content, setContent] = useState(activeTab === "summary" ? "summary" : activeTab === "actions" ? "actions" : "full");

  const handleDownload = () => {
    if (!transcript || !lines) return;
    
    let fileContent = "";
    const fileName = `${transcript.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
    
    if (content === "summary") {
      fileContent = `# ${transcript.title} - Summary\n\n${transcript.summary}`;
    } else if (content === "actions") {
      const actionItems = lines.filter(line => line.isActionItem);
      
      fileContent = `# ${transcript.title} - Action Items\n\n`;
      
      actionItems.forEach(item => {
        fileContent += `## [${formatTimestamp(item.timestamp)}] ${item.speaker}\n`;
        fileContent += `${item.content}\n`;
        if (item.actionAssignee) {
          fileContent += `Assigned to: ${item.actionAssignee}\n`;
        }
        fileContent += `Status: ${item.isCompleted ? "Completed" : "Pending"}\n\n`;
      });
    } else {
      fileContent = `# ${transcript.title} - Full Transcript\n\n`;
      
      lines.forEach(line => {
        fileContent += `[${formatTimestamp(line.timestamp)}] ${line.speaker}: ${line.content}\n`;
        
        if (line.isActionItem) {
          fileContent += `ACTION ITEM`;
          if (line.actionAssignee) {
            fileContent += ` - Assigned to: ${line.actionAssignee}`;
          }
          fileContent += `\n`;
        }
        
        fileContent += '\n';
      });
    }
    
    // Create file and trigger download
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: `Your transcript has been exported as ${fileName}.${format}`,
    });
    
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Options</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="txt">Plain Text (.txt)</SelectItem>
                <SelectItem value="md">Markdown (.md)</SelectItem>
                <SelectItem value="csv">CSV (.csv)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Content to Export</Label>
            <RadioGroup value={content} onValueChange={setContent} className="space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full" id="export-full" />
                <Label htmlFor="export-full">Full transcript with timestamps</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="summary" id="export-summary" />
                <Label htmlFor="export-summary">Summary only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="actions" id="export-actions" />
                <Label htmlFor="export-actions">Action items only</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleDownload} className="ml-3 bg-primary hover:bg-blue-600">
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportModal;
