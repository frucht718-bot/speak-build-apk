import { useState } from "react";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { AIProcessingView } from "@/components/AIProcessingView";
import { CodePreview } from "@/components/CodePreview";
import { ChatInterface } from "@/components/ChatInterface";
import { RealtimeVoiceChat } from "@/components/RealtimeVoiceChat";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2, Code, Image, CheckCircle2, Mic, Volume2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AppStage = "recording" | "processing" | "preview" | "chat";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const Index = () => {
  const [stage, setStage] = useState<AppStage>("recording");
  const [currentStep, setCurrentStep] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [appIcon, setAppIcon] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const getStepStatus = (stepId: string): "pending" | "processing" | "completed" => {
    if (currentStep === stepId) return "processing";
    
    const steps = ["transcription", "generation", "icon", "complete"];
    const currentIndex = steps.indexOf(currentStep);
    const stepIndex = steps.indexOf(stepId);
    
    if (currentIndex > stepIndex) return "completed";
    return "pending";
  };

  const processingSteps = [
    { id: "transcription", label: "Sprache wird transkribiert", status: getStepStatus("transcription"), icon: Loader2 },
    { id: "generation", label: "Code wird generiert", status: getStepStatus("generation"), icon: Code },
    { id: "icon", label: "App-Icon wird erstellt", status: getStepStatus("icon"), icon: Image },
    { id: "complete", label: "App ist fertig", status: getStepStatus("complete"), icon: CheckCircle2 },
  ];

  const handleRecordingComplete = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setStage("processing");
    setCurrentStep("transcription");

    try {
      // Convert audio to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(",")[1];
        
        if (!base64Audio) {
          throw new Error("Fehler beim Konvertieren der Audio-Datei");
        }

        // Step 1: Voice to Text
        const { data: transcriptionData, error: transcriptionError } = await supabase.functions.invoke(
          "voice-to-text",
          { body: { audio: base64Audio } }
        );

        if (transcriptionError) throw transcriptionError;

        const userPrompt = transcriptionData.text;
        toast({
          title: "Spracherkennung erfolgreich",
          description: `Erkannt: "${userPrompt.substring(0, 50)}..."`,
        });

        // Step 2: Generate Code
        setCurrentStep("generation");
        const { data: codeData, error: codeError } = await supabase.functions.invoke(
          "generate-app-code",
          { body: { prompt: userPrompt } }
        );

        if (codeError) throw codeError;

        setGeneratedCode(codeData.code);

        // Step 3: Generate Icon
        setCurrentStep("icon");
        const { data: iconData, error: iconError } = await supabase.functions.invoke(
          "generate-app-icon",
          { body: { prompt: userPrompt } }
        );

        if (iconError) throw iconError;

        setAppIcon(iconData.icon);

        // Complete
        setCurrentStep("complete");
        setTimeout(() => {
          setStage("preview");
          setIsProcessing(false);
        }, 1000);

        toast({
          title: "App erfolgreich erstellt! 🎉",
          description: "Ihre App ist bereit zur Vorschau",
        });
      };
    } catch (error: any) {
      console.error("Fehler beim Verarbeiten:", error);
      toast({
        title: "Fehler",
        description: error.message || "Ein Fehler ist aufgetreten",
        variant: "destructive",
      });
      setStage("recording");
      setIsProcessing(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke("modify-app-code", {
        body: { 
          prompt: message,
          currentCode: generatedCode 
        },
      });

      if (error) throw error;

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Änderungen wurden vorgenommen!",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setGeneratedCode(data.code);

      toast({
        title: "Änderungen angewendet",
        description: "Die App wurde aktualisiert",
      });
    } catch (error: any) {
      console.error("Fehler beim Ändern:", error);
      toast({
        title: "Fehler",
        description: error.message || "Änderungen konnten nicht angewendet werden",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAPK = async () => {
    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("build-apk", {
        body: { code: generatedCode },
      });

      if (error) throw error;

      // Simulate APK download
      toast({
        title: "APK wird erstellt",
        description: "Der Download startet in Kürze...",
      });

      // In real implementation, this would download the actual APK
      setTimeout(() => {
        toast({
          title: "APK fertig! 🚀",
          description: "Ihre App wurde erfolgreich gebaut",
        });
        setIsProcessing(false);
      }, 3000);
    } catch (error: any) {
      console.error("Fehler beim APK Build:", error);
      toast({
        title: "Fehler",
        description: "APK konnte nicht erstellt werden",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background gradients */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyber-cyan/20 rounded-full blur-[120px] animate-float" style={{ animationDelay: "1s" }} />
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12 animate-slide-up">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-primary rounded-2xl shadow-glow">
              <Sparkles className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              KI App Builder
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Erstellen Sie mobile Apps mit der Kraft der KI
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto space-y-8">
          <Tabs defaultValue="classic" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="classic" className="gap-2">
                <Mic className="w-4 h-4" />
                Klassischer Modus
              </TabsTrigger>
              <TabsTrigger value="voice" className="gap-2">
                <Volume2 className="w-4 h-4" />
                Voice-Chat (Echtzeit)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="classic">
              {stage === "recording" && (
                <div className="flex justify-center py-12">
                  <VoiceRecorder
                    onRecordingComplete={handleRecordingComplete}
                    isProcessing={isProcessing}
                  />
                </div>
              )}

              {stage === "processing" && (
                <div className="py-12">
                  <AIProcessingView
                    currentStep={currentStep}
                    steps={processingSteps}
                  />
                </div>
              )}

              {(stage === "preview" || stage === "chat") && (
                <div className="space-y-8">
                  <CodePreview
                    generatedCode={generatedCode}
                    appIcon={appIcon}
                    onDownloadAPK={handleDownloadAPK}
                    isBuilding={isProcessing && stage === "preview"}
                  />

                  <ChatInterface
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    isProcessing={isProcessing}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="voice">
              <div className="max-w-4xl mx-auto py-12">
                <RealtimeVoiceChat />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Index;
