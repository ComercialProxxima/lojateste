import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface TranscriptProcessingProps {
  fileName: string;
  progress: number;
  onCancel: () => void;
}

const TranscriptProcessing = ({ fileName, progress, onCancel }: TranscriptProcessingProps) => {
  return (
    <Card className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Processing: {fileName}</h3>
        <Button 
          variant="ghost" 
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 text-sm h-auto p-0"
        >
          Cancel
        </Button>
      </div>
      
      <div>
        <div className="flex items-center">
          <Progress value={progress} className="h-2.5 flex-grow" />
          <span className="ml-2 text-sm text-gray-600">{progress}%</span>
        </div>
        <p className="mt-2 text-sm text-gray-600">Transcribing audio and identifying action items...</p>
      </div>
    </Card>
  );
};

export default TranscriptProcessing;
