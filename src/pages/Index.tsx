import { useState } from "react";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { AIProcessingView } from "@/components/AIProcessingView";
import { CodePreview } from "@/components/CodePreview";
import { ParticleBackground } from "@/components/ParticleBackground";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Code, Image, CheckCircle2, Mic, MessageSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TextChatInterface } from "@/components/TextChatInterface";

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
  const [recognizedText, setRecognizedText] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const { toast } = useToast();

const getStepStatus = (stepId: string): "pending" | "processing" | "completed" => {
  if (currentStep === stepId) return "processing";
  
  const steps = ["transcription", "generation", "icon", "complete"];
  const currentIndex = steps.indexOf(currentStep);
  const stepIndex = steps.indexOf(stepId);
  
  if (currentIndex > stepIndex) return "completed";
  return "pending";
};

const addLog = (message: string) => {
  setLogs((prev) => [...prev, message]);
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

        try {
          addLog("Transkription gestartet");
          // Step 1: Voice to Text
          const { data: transcriptionData, error: transcriptionError } = await supabase.functions.invoke(
            "voice-to-text",
            { body: { audio: base64Audio } }
          );

          if (transcriptionError || !transcriptionData?.text) {
            const errMsg = (transcriptionData as any)?.error || transcriptionError?.message || "Transkription fehlgeschlagen";
            throw new Error(errMsg);
          }

          const userPrompt = transcriptionData.text as string;
          setRecognizedText(userPrompt);
          addLog(`Erkannter Text: "${userPrompt.substring(0, 80)}${userPrompt.length > 80 ? '…' : ''}"`);

          toast({
            title: "Spracherkennung erfolgreich",
            description: `Erkannt: "${userPrompt.substring(0, 50)}..."`,
          });

          // Step 2: Generate Code
          setCurrentStep("generation");
          addLog("Starte Code-Generierung");
          const { data: codeData, error: codeError } = await supabase.functions.invoke(
            "generate-app-code",
            { body: { prompt: userPrompt } }
          );

          if (codeError || !codeData?.code) throw new Error(codeError?.message || "Code-Generierung fehlgeschlagen");

          setGeneratedCode(codeData.code);
          addLog("Code generiert");

          // Step 3: Generate Icon
          setCurrentStep("icon");
          addLog("Erstelle App-Icon");
          const { data: iconData, error: iconError } = await supabase.functions.invoke(
            "generate-app-icon",
            { body: { prompt: userPrompt } }
          );

          if (iconError || !iconData?.icon) throw new Error(iconError?.message || "Icon-Erstellung fehlgeschlagen");

          setAppIcon(iconData.icon);
          addLog("App-Icon erstellt");

          // Complete
          setCurrentStep("complete");
          addLog("Fertig – Vorschau bereit");
          setTimeout(() => {
            setStage("preview");
            setIsProcessing(false);
          }, 600);

          toast({
            title: "App erfolgreich erstellt!",
            description: "Ihre App ist bereit zur Vorschau",
          });
        } catch (err: any) {
          console.error("Transkriptions-/Generierungsfehler:", err);
          toast({
            title: "Fehler",
            description: err?.message || "Ein Fehler ist aufgetreten",
            variant: "destructive",
          });
          addLog(`Fehler: ${err?.message || 'Unbekannt'}`);
          setStage("recording");
          setIsProcessing(false);
          setCurrentStep("");
        }
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

      const apkUrl = data?.apkUrl;
      if (apkUrl) {
        toast({ title: "APK bereit", description: "Download startet..." });
        window.open(apkUrl, "_blank");
      } else {
        toast({ title: "Hinweis", description: "APK-URL nicht verfügbar" });
      }
    } catch (error: any) {
      console.error("Fehler beim APK Build:", error);
      toast({ title: "Fehler", description: error.message || "APK konnte nicht erstellt werden", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Minimal layout - Background visuals removed as requested */}

      <div className="container mx-auto px-4 py-12">
        {/* Minimaler Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-cyber-cyan to-primary bg-clip-text text-transparent">
            KI App Builder
          </h1>
          <p className="mt-2 text-xs md:text-sm text-muted-foreground">
            Android-APKs per Spracheingabe oder Chat • Kein Code sichtbar
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto space-y-12">
          <Tabs defaultValue="sprache" className="w-full">
            <div className="relative mb-12">
              <div className="absolute inset-0 bg-gradient-primary opacity-10 blur-3xl rounded-full" />
              <TabsList className="relative grid w-full max-w-3xl mx-auto grid-cols-2 p-2 bg-muted/30 backdrop-blur-glass border border-border/50 shadow-glass">
                <TabsTrigger 
                  value="sprache" 
                  className="gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all duration-300"
                >
                  <Mic className="w-4 h-4" />
                  Spracheingabe
                </TabsTrigger>
                <TabsTrigger 
                  value="text" 
                  className="gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all duration-300"
                >
                  <MessageSquare className="w-4 h-4" />
                  Chat
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="sprache">
              {stage === "recording" && (
                <div className="flex justify-center py-12">
                  <VoiceRecorder
                    onRecordingComplete={handleRecordingComplete}
                    isProcessing={isProcessing}
                  />
                </div>
              )}

              {stage === "processing" && (
                <div className="py-12 space-y-8">
                  <AIProcessingView
                    currentStep={currentStep}
                    steps={processingSteps}
                  />

                  {recognizedText && (
                    <div className="bg-card/40 backdrop-blur-glass border border-border/50 rounded-xl p-6">
                      <h4 className="text-sm font-semibold mb-2">Erkannter Text</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{recognizedText}</p>
                    </div>
                  )}

                  {logs.length > 0 && (
                    <div className="bg-card/40 backdrop-blur-glass border border-border/50 rounded-xl p-6">
                      <h4 className="text-sm font-semibold mb-2">Schritte</h4>
                      <ol className="text-sm text-muted-foreground space-y-2">
                        {logs.map((l, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                            <span>{l}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {(stage === "preview") && (
                <div className="space-y-8">
                  {recognizedText && (
                    <div className="bg-card/40 backdrop-blur-glass border border-border/50 rounded-xl p-6">
                      <h4 className="text-sm font-semibold mb-2">Erkannter Text</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{recognizedText}</p>
                    </div>
                  )}

                  {logs.length > 0 && (
                    <div className="bg-card/40 backdrop-blur-glass border border-border/50 rounded-xl p-6">
                      <h4 className="text-sm font-semibold mb-2">Schritte</h4>
                      <ol className="text-sm text-muted-foreground space-y-2">
                        {logs.map((l, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                            <span>{l}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  <CodePreview
                    generatedCode={generatedCode}
                    appIcon={appIcon}
                    onDownloadAPK={handleDownloadAPK}
                    isBuilding={isProcessing}
                  />
                </div>
              )}
            </TabsContent>


            <TabsContent value="text">
              <div className="max-w-5xl mx-auto py-12">
                <TextChatInterface />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Index;
