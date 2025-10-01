import { Loader2, Sparkles, Code, Image, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProcessingStep {
  id: string;
  label: string;
  status: "pending" | "processing" | "completed";
  icon: typeof Loader2;
}

interface AIProcessingViewProps {
  currentStep: string;
  steps: ProcessingStep[];
}

export const AIProcessingView = ({ currentStep, steps }: AIProcessingViewProps) => {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative">
        {/* Glass card with glow effect */}
        <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-3xl rounded-3xl animate-glow-rotate" />
        
        <div className="relative bg-card/40 backdrop-blur-glass border border-border/50 rounded-3xl p-8 shadow-glass">
          <div className="flex items-center gap-3 mb-8">
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              KI erstellt deine App
            </h2>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.status === "processing";
              const isCompleted = step.status === "completed";
              
              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-2xl transition-all duration-500",
                    isActive && "bg-primary/10 shadow-glow animate-pulse-glow",
                    isCompleted && "bg-primary/5",
                    !isActive && !isCompleted && "opacity-50"
                  )}
                >
                  <div
                    className={cn(
                      "relative flex items-center justify-center h-12 w-12 rounded-full transition-all duration-300",
                      isActive && "bg-gradient-primary shadow-glow animate-voice-pulse",
                      isCompleted && "bg-primary/20",
                      !isActive && !isCompleted && "bg-muted"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-6 w-6 text-primary" />
                    ) : (
                      <Icon className={cn(
                        "h-6 w-6",
                        isActive ? "text-primary-foreground animate-spin" : "text-muted-foreground"
                      )} />
                    )}
                  </div>

                  <div className="flex-1">
                    <p className={cn(
                      "font-medium transition-colors",
                      isActive && "text-foreground",
                      isCompleted && "text-muted-foreground",
                      !isActive && !isCompleted && "text-muted-foreground"
                    )}>
                      {step.label}
                    </p>
                  </div>

                  {isActive && (
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="h-2 w-2 rounded-full bg-primary animate-pulse"
                          style={{ animationDelay: `${i * 0.2}s` }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
