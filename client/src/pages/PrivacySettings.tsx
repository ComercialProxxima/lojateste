import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";

type PrivacySettings = {
  id: number;
  userId: number;
  autoDeleteDays: number;
  anonymizeData: boolean;
  allowAiTraining: boolean;
};

const PrivacySettings = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("privacy");
  
  const { data: settings, isLoading } = useQuery<PrivacySettings>({
    queryKey: ["/api/privacy-settings"],
  });
  
  const { register, handleSubmit, watch, setValue, formState: { isDirty } } = useForm<Omit<PrivacySettings, "id" | "userId">>({
    defaultValues: {
      autoDeleteDays: settings?.autoDeleteDays || 30,
      anonymizeData: settings?.anonymizeData || true,
      allowAiTraining: settings?.allowAiTraining || false,
    }
  });
  
  // Update form values when settings are loaded
  React.useEffect(() => {
    if (settings) {
      setValue("autoDeleteDays", settings.autoDeleteDays);
      setValue("anonymizeData", settings.anonymizeData);
      setValue("allowAiTraining", settings.allowAiTraining);
    }
  }, [settings, setValue]);
  
  const updateMutation = useMutation({
    mutationFn: async (data: Omit<PrivacySettings, "id" | "userId">) => {
      const res = await apiRequest("PUT", "/api/privacy-settings", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/privacy-settings"] });
      toast({
        title: "Settings Updated",
        description: "Your privacy settings have been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update settings: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: Omit<PrivacySettings, "id" | "userId">) => {
    updateMutation.mutate(data);
  };
  
  const autoDeleteDays = watch("autoDeleteDays");
  const anonymizeData = watch("anonymizeData");
  const allowAiTraining = watch("allowAiTraining");

  return (
    <>
      <Tabs defaultValue="privacy" className="w-full" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="mb-6 border-b border-gray-200 w-full justify-start">
          <TabsTrigger value="transcriptions" className="data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary" asChild>
            <Link href="/">Transcriptions</Link>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary">
            Privacy Settings
          </TabsTrigger>
          <TabsTrigger value="account" className="data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary" asChild>
            <Link href="/account">Account</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Privacy Settings</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <h4 className="text-base font-medium text-gray-800 mb-2">Data Retention</h4>
                <p className="text-sm text-gray-600 mb-3">Control how long your meeting data is stored in our system.</p>
                
                <RadioGroup
                  value={autoDeleteDays.toString()}
                  onValueChange={(value) => setValue("autoDeleteDays", parseInt(value), { shouldDirty: true })}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="30" id="retention-30" />
                    <Label htmlFor="retention-30">Auto-delete after 30 days</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="90" id="retention-90" />
                    <Label htmlFor="retention-90">Auto-delete after 90 days</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="0" id="retention-forever" />
                    <Label htmlFor="retention-forever">Keep until manually deleted</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="text-base font-medium text-gray-800 mb-2">Transcription Privacy</h4>
                <p className="text-sm text-gray-600 mb-3">Choose how your meeting recordings and transcriptions are processed.</p>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="privacy-anonymized" 
                      checked={anonymizeData}
                      onCheckedChange={(checked) => setValue("anonymizeData", checked === true, { shouldDirty: true })}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="privacy-anonymized" className="text-sm font-medium">
                        Generate anonymized data only
                      </Label>
                      <p className="text-xs text-gray-500">Names and sensitive information will be automatically detected and anonymized</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="text-base font-medium text-gray-800 mb-2">Data Processing</h4>
                <p className="text-sm text-gray-600 mb-3">Manage how your data is used for service improvements.</p>
                
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="ai-training" 
                    checked={allowAiTraining}
                    onCheckedChange={(checked) => setValue("allowAiTraining", checked === true, { shouldDirty: true })}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="ai-training" className="text-sm font-medium">
                      Allow anonymized data to be used for AI training
                    </Label>
                    <p className="text-xs text-gray-500">This helps improve our transcription accuracy and action item detection</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={!isDirty || updateMutation.isPending}
                  className="bg-primary hover:bg-blue-600"
                >
                  {updateMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default PrivacySettings;
