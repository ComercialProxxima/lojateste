import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranscriptContext } from "@/context/TranscriptContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { X, Download } from "lucide-react";
import { formatTimestamp } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import ExportModal from "./ExportModal";

type TranscriptLine = {
  id: number;
  transcriptId: number;
  timestamp: number;
  speaker: string;
  content: string;
  isActionItem: boolean;
  actionAssignee: string | null;
  isCompleted: boolean;
};

type TranscriptData = {
  transcript: {
    id: number;
    title: string;
    summary: string;
  };
  lines: TranscriptLine[];
};

const TranscriptViewer = () => {
  const { activeTranscriptId, closeTranscript } = useTranscriptContext();
  const [activeTab, setActiveTab] = useState<"summary" | "full" | "actions">("full");
  const [searchQuery, setSearchQuery] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);
  
  const { data, isLoading } = useQuery<TranscriptData>({
    queryKey: [`/api/transcripts/${activeTranscriptId}`],
    enabled: !!activeTranscriptId,
  });
  
  const markCompletedMutation = useMutation({
    mutationFn: async ({ id, isCompleted }: { id: number; isCompleted: boolean }) => {
      const res = await apiRequest("PATCH", `/api/transcript-lines/${id}`, {
        isCompleted,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/transcripts/${activeTranscriptId}`] });
    },
  });
  
  const handleMarkCompleted = (id: number, currentState: boolean) => {
    markCompletedMutation.mutate({ id, isCompleted: !currentState });
  };
  
  const filteredLines = data?.lines.filter(line => {
    if (!searchQuery) return true;
    return line.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
           line.speaker.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  const actionItems = data?.lines.filter(line => line.isActionItem);
  
  return (
    <>
      <Card className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="border-b border-gray-200">
          <div className="px-6 py-4 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              {isLoading ? <Skeleton className="h-6 w-48" /> : data?.transcript.title}
            </h3>
            <Button variant="ghost" size="icon" onClick={closeTranscript}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <Tabs
            defaultValue="full"
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "summary" | "full" | "actions")}
            className="w-full"
          >
            <div className="px-6 py-2 bg-gray-50 flex items-center justify-between border-t border-gray-200">
              <TabsList className="bg-transparent p-0 h-auto">
                <TabsTrigger 
                  value="summary" 
                  className={`px-3 py-1 rounded-md text-sm ${
                    activeTab === "summary" 
                      ? "bg-primary text-white" 
                      : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                  }`}
                >
                  Summary
                </TabsTrigger>
                <TabsTrigger 
                  value="full" 
                  className={`px-3 py-1 rounded-md text-sm ml-3 ${
                    activeTab === "full" 
                      ? "bg-primary text-white" 
                      : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                  }`}
                >
                  Full Transcript
                </TabsTrigger>
                <TabsTrigger 
                  value="actions" 
                  className={`px-3 py-1 rounded-md text-sm ml-3 ${
                    activeTab === "actions" 
                      ? "bg-primary text-white" 
                      : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                  }`}
                >
                  Action Items
                </TabsTrigger>
              </TabsList>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExportModal(true)}
                className="flex items-center px-3 py-1 bg-gray-200 rounded-md text-sm text-gray-600 hover:bg-gray-300"
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </Tabs>
        </div>
        
        <CardContent className="p-6">
          <TabsContent value="summary" className="mt-0">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Meeting Summary</h4>
                <div className="bg-gray-50 p-4 rounded-md text-gray-700">
                  <p className="whitespace-pre-line">{data?.transcript.summary}</p>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="full" className="mt-0">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">Full Transcript</h4>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search transcript..."
                  className="px-3 py-1 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex">
                    <Skeleton className="h-4 w-16 flex-shrink-0" />
                    <div className="flex-grow ml-4">
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredLines?.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No results found for "{searchQuery}"
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredLines?.map((line) => (
                  <div key={line.id} className="transcript-line flex hover:bg-gray-50 rounded-md">
                    <div className="w-20 flex-shrink-0 text-sm text-gray-500">
                      {formatTimestamp(line.timestamp)}
                    </div>
                    <div className="flex-grow">
                      {line.isActionItem ? (
                        <div className="bg-amber-50 border-l-2 border-amber-400 p-2 rounded-md">
                          <div className="text-gray-900">
                            <span className="font-medium">{line.speaker}:</span> {line.content}
                          </div>
                          <div className="mt-1 flex items-center">
                            <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                              ACTION ITEM
                            </Badge>
                            {line.actionAssignee && (
                              <Badge variant="outline" className="ml-2 bg-gray-100 hover:bg-gray-100">
                                Assigned to: {line.actionAssignee}
                              </Badge>
                            )}
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => handleMarkCompleted(line.id, line.isCompleted)}
                              className="ml-2 text-xs text-primary h-auto p-0"
                              disabled={markCompletedMutation.isPending}
                            >
                              {line.isCompleted ? "Mark as incomplete" : "Mark as completed"}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-900">
                          <span className="font-medium">{line.speaker}:</span> {line.content}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="actions" className="mt-0">
            <h4 className="font-medium text-gray-900 mb-4">Action Items</h4>
            
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : actionItems?.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No action items found in this transcript.
              </div>
            ) : (
              <div className="space-y-4">
                {actionItems?.map((item) => (
                  <div key={item.id} className="bg-amber-50 border-l-2 border-amber-400 p-3 rounded-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-16 flex-shrink-0 text-sm text-gray-500">
                          {formatTimestamp(item.timestamp)}
                        </div>
                        <span className="font-medium">{item.speaker}</span>
                      </div>
                      <div>
                        {item.actionAssignee && (
                          <Badge variant="outline" className="ml-2 bg-gray-100 hover:bg-gray-100">
                            Assigned to: {item.actionAssignee}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={`ml-2 ${
                            item.isCompleted
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                          }`}
                        >
                          {item.isCompleted ? "Completed" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                    <p className="mt-2 text-gray-800">{item.content}</p>
                    <div className="mt-2 flex justify-end">
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => handleMarkCompleted(item.id, item.isCompleted)}
                        className="text-xs text-primary h-auto p-0"
                        disabled={markCompletedMutation.isPending}
                      >
                        {item.isCompleted ? "Mark as incomplete" : "Mark as completed"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </CardContent>
      </Card>
      
      {showExportModal && (
        <ExportModal
          onClose={() => setShowExportModal(false)}
          transcript={data?.transcript}
          lines={data?.lines}
          activeTab={activeTab}
        />
      )}
    </>
  );
};

export default TranscriptViewer;
