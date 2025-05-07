import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useTranscriptContext } from "@/context/TranscriptContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

type Transcript = {
  id: number;
  userId: number;
  title: string;
  fileName: string;
  duration: number;
  createdAt: string;
  summary: string;
  actionItemCount: number;
};

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} min`;
  }
  
  return `${minutes} minutes`;
};

const TranscriptsList = () => {
  const { setActiveTranscriptId, activeTranscript } = useTranscriptContext();
  
  const { data: transcripts, isLoading, isError } = useQuery<Transcript[]>({
    queryKey: ['/api/transcripts'],
  });
  
  const handleViewTranscript = (id: number) => {
    setActiveTranscriptId(id);
  };

  return (
    <Card className="bg-white shadow rounded-lg overflow-hidden mb-6">
      <CardHeader className="px-6 py-4 border-b border-gray-200">
        <CardTitle className="text-lg">Recent Transcriptions</CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        {isLoading ? (
          <div className="divide-y divide-gray-200">
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-6 py-4">
                <Skeleton className="h-5 w-1/3 mb-2" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="p-6 text-center text-gray-500">
            Failed to load transcripts. Please try again.
          </div>
        ) : transcripts?.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No transcriptions yet. Upload an audio file to get started.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {transcripts?.map((transcript) => (
              <div key={transcript.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-medium text-gray-900">
                      {transcript.title}
                    </h4>
                    <div className="flex items-center mt-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="ml-1 text-sm text-gray-500">
                        {formatDuration(transcript.duration)}
                      </span>
                      <span className="mx-2 text-gray-300">•</span>
                      <span className="text-sm text-gray-500">
                        {format(new Date(transcript.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {transcript.actionItemCount > 0 && (
                      <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                        {transcript.actionItemCount} Actions
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewTranscript(transcript.id)}
                      className="text-gray-400 hover:text-primary"
                    >
                      <Eye className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TranscriptsList;
