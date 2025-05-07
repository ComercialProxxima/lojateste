import { useState, useRef } from "react";
import { useTranscriptContext } from "@/context/TranscriptContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { UploadCloud } from "lucide-react";

type PrivacySettings = {
  autoDeleteDays: number;
  anonymizeData: boolean;
  allowAiTraining: boolean;
};

const UploadSection = () => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { uploadTranscript } = useTranscriptContext();
  
  const { data: privacySettings } = useQuery<PrivacySettings>({
    queryKey: ['/api/privacy-settings'],
  });
  
  const [autoDelete, setAutoDelete] = useState(true);
  const [anonymize, setAnonymize] = useState(true);
  
  // Update state when privacy settings are loaded
  React.useEffect(() => {
    if (privacySettings) {
      setAutoDelete(privacySettings.autoDeleteDays > 0);
      setAnonymize(privacySettings.anonymizeData);
    }
  }, [privacySettings]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        
        // Auto-generate title from filename if not provided
        if (!title) {
          const fileName = selectedFile.name;
          const fileNameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
          setTitle(fileNameWithoutExt);
        }
      }
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
        
        // Auto-generate title from filename if not provided
        if (!title) {
          const fileName = droppedFile.name;
          const fileNameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
          setTitle(fileNameWithoutExt);
        }
      }
    }
  };
  
  const validateFile = (file: File): boolean => {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a'];
    const maxSize = 50 * 1024 * 1024; // 50 MB
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an MP3, WAV, or M4A file.",
        variant: "destructive",
      });
      return false;
    }
    
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 50 MB.",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };
  
  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select an audio file to upload.",
        variant: "destructive",
      });
      return;
    }
    
    if (!title.trim()) {
      const fileName = file.name;
      const fileNameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
      setTitle(fileNameWithoutExt);
    }
    
    try {
      await uploadTranscript(file, title.trim());
      
      // Reset form
      setFile(null);
      setTitle("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      toast({
        title: "Upload Started",
        description: "Your audio is being processed. This may take a few minutes.",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error.message || "An error occurred during upload.",
        variant: "destructive",
      });
    }
  };
  
  const openFileUploader = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Card className="bg-white shadow rounded-lg p-6 mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Meeting Recording</h3>
      
      <div 
        className={`border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center ${
          isDragging ? 'border-primary bg-blue-50' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <UploadCloud className="h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Drag and drop your audio file here, or{' '}
          <Button 
            variant="link" 
            onClick={openFileUploader}
            className="text-primary font-medium p-0 h-auto"
          >
            browse
          </Button>
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Supported formats: MP3, WAV, M4A (max 50MB)
        </p>
        <input 
          type="file" 
          className="hidden" 
          accept="audio/mp3,audio/wav,audio/m4a,audio/mp4" 
          onChange={handleFileChange}
          ref={fileInputRef}
        />
      </div>
      
      {file && (
        <div className="mt-4">
          <div className="flex items-center space-x-2 mb-4">
            <div className="bg-blue-100 p-2 rounded-md">
              <div className="text-blue-500 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              Remove
            </Button>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Meeting Title</Label>
              <Input
                id="title"
                placeholder="Enter a title for this recording"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Privacy Controls</h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="auto-delete" 
              checked={autoDelete}
              onCheckedChange={(checked) => setAutoDelete(checked === true)}
            />
            <Label htmlFor="auto-delete" className="text-sm text-gray-700">
              Auto-delete transcription after 30 days
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="anonymize" 
              checked={anonymize}
              onCheckedChange={(checked) => setAnonymize(checked === true)}
            />
            <Label htmlFor="anonymize" className="text-sm text-gray-700">
              Generate anonymized data only
            </Label>
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex justify-end">
        <Button 
          onClick={handleUpload} 
          disabled={!file}
          className="bg-primary text-white hover:bg-blue-600"
        >
          Upload & Transcribe
        </Button>
      </div>
    </Card>
  );
};

export default UploadSection;
