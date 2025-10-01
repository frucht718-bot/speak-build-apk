import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

export const LoadingSpinner = ({ size = "md", className, text }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative">
        {/* Outer spinning ring */}
        <div
          className={cn(
            "absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin",
            sizeClasses[size]
          )}
        />
        
        {/* Middle spinning ring */}
        <div
          className={cn(
            "absolute inset-1 rounded-full border-4 border-transparent border-t-primary/60 animate-spin",
            sizeClasses[size]
          )}
          style={{ animationDirection: "reverse", animationDuration: "1s" }}
        />
        
        {/* Inner pulsing dot */}
        <div
          className={cn(
            "absolute inset-2 rounded-full bg-gradient-primary animate-pulse shadow-glow",
            sizeClasses[size]
          )}
        />
      </div>
      
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      )}
    </div>
  );
};
