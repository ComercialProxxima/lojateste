import { createContext, useContext, useState, ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface TranscriptContextType {
  activeTranscriptId: number | null;
  activeTranscript: boolean;
  setActiveTranscriptId: (id: number) => void;
  closeTranscript: () => void;
  uploadTranscript: (file: File, title: string) => Promise<void>;
  isProcessing: boolean;
  processingProgress: number;
  processingFileName: string;
  cancelProcessing: () => void;
}

const TranscriptContext = createContext<TranscriptContextType | undefined>(undefined);

export const TranscriptProvider = ({ children }: { children: ReactNode }) => {
  const [activeTranscriptId, setActiveTranscriptId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingFileName, setProcessingFileName] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const closeTranscript = () => {
    setActiveTranscriptId(null);
  };
  
  const uploadMutation = useMutation({
    mutationFn: async ({ file, title }: { file: File; title: string }) => {
      const formData = new FormData();
      formData.append("audio", file);
      formData.append("title", title);
      
      // Set up simulated progress
      setIsProcessing(true);
      setProcessingFileName(file.name);
      setProcessingProgress(0);
      
      const progressInterval = setInterval(() => {
        setProcessingProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 5;
        });
      }, 500);
      
      try {
        const response = await fetch("/api/transcripts/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        
        clearInterval(progressInterval);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || response.statusText);
        }
        
        setProcessingProgress(100);
        
        // Simulate a small delay before removing the processing indicator
        setTimeout(() => {
          setIsProcessing(false);
          setProcessingProgress(0);
          setProcessingFileName("");
        }, 1000);
        
        return await response.json();
      } catch (error) {
        clearInterval(progressInterval);
        setIsProcessing(false);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transcripts'] });
      toast({
        title: "Transcription Complete",
        description: "Your audio has been successfully transcribed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Transcription Failed",
        description: error.message || "An error occurred during transcription.",
        variant: "destructive",
      });
    },
  });
  
  const uploadTranscript = async (file: File, title: string) => {
    await uploadMutation.mutateAsync({ file, title });
  };
  
  const cancelProcessing = () => {
    // In a real app, this would cancel the API request
    // For now, just reset the UI state
    setIsProcessing(false);
    setProcessingProgress(0);
    setProcessingFileName("");
    
    toast({
      title: "Processing Cancelled",
      description: "The transcription process has been cancelled.",
    });
  };
  
  return (
    <TranscriptContext.Provider
      value={{
        activeTranscriptId,
        activeTranscript: activeTranscriptId !== null,
        setActiveTranscriptId,
        closeTranscript,
        uploadTranscript,
        isProcessing,
        processingProgress,
        processingFileName,
        cancelProcessing,
      }}
    >
      {children}
    </TranscriptContext.Provider>
  );
};

export const useTranscriptContext = () => {
  const context = useContext(TranscriptContext);
  if (context === undefined) {
    throw new Error("useTranscriptContext must be used within a TranscriptProvider");
  }
  return context;
};
