import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
}

export const ChatInterface = ({ messages, onSendMessage, isProcessing }: ChatInterfaceProps) => {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (input.trim() && !isProcessing) {
      onSendMessage(input);
      setInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-slide-up">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-primary opacity-10 blur-3xl rounded-3xl" />
        
        <div className="relative bg-card/40 backdrop-blur-glass border border-border/50 rounded-3xl shadow-glass overflow-hidden">
          <div className="p-6 border-b border-border/50">
            <h3 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Änderungen vornehmen
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Sage mir, was du ändern möchtest
            </p>
          </div>

          <ScrollArea className="h-[400px] p-6" ref={scrollRef}>
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <p>Noch keine Nachrichten</p>
                  <p className="text-sm mt-2">Starte eine Unterhaltung über deine App</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-3 transition-all duration-300",
                        message.role === "user"
                          ? "bg-gradient-primary text-primary-foreground shadow-glow"
                          : "bg-muted/50 text-foreground"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <span className="text-xs opacity-60 mt-1 block">
                        {message.timestamp.toLocaleTimeString("de-DE", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-muted/50 rounded-2xl px-4 py-3 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm">KI denkt nach...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-6 border-t border-border/50">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Beschreibe deine Änderungen..."
                disabled={isProcessing}
                className="flex-1 bg-background/50 border-border/50 focus:border-primary"
              />
              <Button
                onClick={handleSend}
                disabled={isProcessing || !input.trim()}
                className="bg-gradient-primary hover:opacity-90 shadow-glow"
                size="lg"
              >
                {isProcessing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
