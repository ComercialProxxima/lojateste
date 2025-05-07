import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import UploadSection from "@/components/UploadSection";
import TranscriptsList from "@/components/TranscriptsList";
import TranscriptViewer from "@/components/TranscriptViewer";
import TranscriptProcessing from "@/components/TranscriptProcessing";
import { useTranscriptContext } from "@/context/TranscriptContext";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";

const Transcriptions = () => {
  const { activeTranscript, isProcessing, processingProgress, processingFileName, cancelProcessing } = useTranscriptContext();
  const [activeTab, setActiveTab] = useState("transcriptions");

  return (
    <>
      <Tabs defaultValue="transcriptions" className="w-full" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="mb-6 border-b border-gray-200 w-full justify-start">
          <TabsTrigger value="transcriptions" className="data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary">
            Transcriptions
          </TabsTrigger>
          <TabsTrigger value="privacy" className="data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary" asChild>
            <Link href="/privacy-settings">Privacy Settings</Link>
          </TabsTrigger>
          <TabsTrigger value="account" className="data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary" asChild>
            <Link href="/account">Account</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Meeting Transcriptions</h2>
        
        <UploadSection />
        
        {isProcessing && (
          <TranscriptProcessing 
            fileName={processingFileName}
            progress={processingProgress}
            onCancel={cancelProcessing}
          />
        )}
        
        <TranscriptsList />
        
        {activeTranscript && <TranscriptViewer />}
      </div>
    </>
  );
};

export default Transcriptions;
