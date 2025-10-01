import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2, AlertCircle, Clock } from "lucide-react";

interface StatusBadgeProps {
  status: "idle" | "processing" | "success" | "error";
  text?: string;
  className?: string;
}

export const StatusBadge = ({ status, text, className }: StatusBadgeProps) => {
  const config = {
    idle: {
      icon: Clock,
      color: "text-muted-foreground",
      bgColor: "bg-muted/50",
      borderColor: "border-muted",
      text: text || "Bereit",
    },
    processing: {
      icon: Loader2,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/30",
      text: text || "Wird verarbeitet...",
      animate: true,
    },
    success: {
      icon: CheckCircle2,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
      text: text || "Erfolgreich",
    },
    error: {
      icon: AlertCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      borderColor: "border-destructive/30",
      text: text || "Fehler",
    },
  };

  const { icon: Icon, color, bgColor, borderColor, text: displayText } = config[status];
  const animate = status === "processing";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-sm transition-all duration-300",
        bgColor,
        borderColor,
        className
      )}
    >
      <Icon className={cn("w-4 h-4", color, animate && "animate-spin")} />
      <span className={cn("text-sm font-medium", color)}>{displayText}</span>
    </div>
  );
};
