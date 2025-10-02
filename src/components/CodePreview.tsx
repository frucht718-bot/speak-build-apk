import { useState } from "react";
import { Code, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface CodePreviewProps {
  generatedCode: string;
  appIcon?: string;
  onDownloadAPK: () => void;
  isBuilding: boolean;
}

export const CodePreview = ({ 
  generatedCode, 
  appIcon, 
  onDownloadAPK,
  isBuilding 
}: CodePreviewProps) => {
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");

  return (
    <div className="w-full max-w-4xl mx-auto animate-slide-up">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-cyber opacity-20 blur-3xl rounded-3xl" />
        
        <div className="relative bg-card/40 backdrop-blur-glass border border-border/50 rounded-3xl p-6 shadow-glass">
          <div className="flex items-center justify-between mb-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "preview" | "code")} className="w-full">
              <TabsList className="bg-muted/30 backdrop-blur-sm">
                <TabsTrigger value="preview" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Vorschau
                </TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="mt-6">
                <div className="space-y-6">
                  {appIcon && (
                    <div className="flex flex-col items-center gap-4 p-6 bg-muted/20 rounded-2xl">
                      <img 
                        src={appIcon} 
                        alt="App-Icon" 
                        className="w-24 h-24 rounded-3xl shadow-glow animate-float"
                      />
                      <p className="text-sm text-muted-foreground">Generiertes App-Icon</p>
                    </div>
                  )}
                  
                  <div className="bg-background/50 rounded-2xl p-8 min-h-[400px] flex items-center justify-center border border-border/30">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 mx-auto bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow">
                        <Eye className="h-8 w-8 text-primary-foreground" />
                      </div>
                      <p className="text-lg font-medium">Live App Vorschau</p>
                      <p className="text-sm text-muted-foreground max-w-md">
                        Hier siehst du eine Live-Vorschau deiner generierten App
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

            </Tabs>
          </div>

          <div className="flex gap-4 mt-6">
            <Button
              onClick={onDownloadAPK}
              disabled={isBuilding || !generatedCode}
              className="flex-1 bg-gradient-primary hover:opacity-90 shadow-glow"
              size="lg"
            >
              <Download className="mr-2 h-5 w-5" />
              {isBuilding ? "APK wird erstellt..." : "APK herunterladen"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
