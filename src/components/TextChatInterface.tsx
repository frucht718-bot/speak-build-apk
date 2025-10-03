import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export const TextChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [provider, setProvider] = useState<"gemini" | "groq" | "openai">("gemini");
  const [model, setModel] = useState<string>("llama-3.3-70b-versatile");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);

    try {
      const payload: any = {
        messages: [...messages, userMessage].map(m => ({
          role: m.role,
          content: m.content
        })),
        provider,
      };
      if (provider === 'groq') payload.model = model;

      const { data, error } = await supabase.functions.invoke("chat-with-ai", {
        body: payload,
      });

      if (error) throw error;

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "Keine Antwort erhalten",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      toast({
        title: "Antwort erhalten",
        description: `Von ${provider.toUpperCase()}`,
      });
    } catch (error: any) {
      console.error("Fehler beim Chat:", error);
      toast({
        title: "Fehler",
        description: error.message || "Nachricht konnte nicht gesendet werden",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getProviderLabel = (p: string) => {
    switch (p) {
      case "gemini": return "Gemini 2.5 Flash";
      case "groq": return "Groq Mixtral";
      case "openai": return "OpenAI GPT-4o";
      default: return p;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto animate-slide-up">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-primary opacity-10 blur-3xl rounded-3xl" />
        
        <div className="relative bg-card/40 backdrop-blur-glass border border-border/50 rounded-3xl shadow-glass overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-border/50 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-primary rounded-lg">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  KI Text-Chat
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Fest integriert: Android APK Builder. Keine Codeausgabe – nur klare Schritte.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Select value={provider} onValueChange={(v: any) => setProvider(v)}>
                <SelectTrigger className="w-[200px] bg-background/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Gemini 2.5 Flash
                    </div>
                  </SelectItem>
                  <SelectItem value="groq">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-cyber-cyan" />
                      Groq (Modelle wählbar)
                    </div>
                  </SelectItem>
                  <SelectItem value="openai">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-green-500" />
                      OpenAI GPT-4o
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {provider === 'groq' && (
                <Select value={model} onValueChange={(v: any) => setModel(v)}>
                  <SelectTrigger className="w-[230px] bg-background/50 border-border/50">
                    <SelectValue placeholder="Groq-Modell" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile</SelectItem>
                    <SelectItem value="llama-3.1-70b-versatile">Llama 3.1 70B Versatile</SelectItem>
                    <SelectItem value="llama-3.1-8b-instant">Llama 3.1 8B Instant</SelectItem>
                    <SelectItem value="mixtral-8x7b-32768">Mixtral 8x7B (32k)</SelectItem>
                    <SelectItem value="gemma2-9b-it">Gemma 2 9B (IT)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="h-[500px] p-6" ref={scrollRef}>
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-16">
                  <div className="inline-flex p-4 bg-gradient-primary/10 rounded-full mb-4">
                    <Bot className="h-12 w-12 text-primary animate-float" />
                  </div>
                  <p className="text-lg font-semibold">Noch keine Nachrichten</p>
                  <p className="text-sm mt-2">Starte eine Unterhaltung mit der KI</p>
                  <p className="text-xs mt-4 text-muted-foreground">
                    Aktuelles Modell: {getProviderLabel(provider)}
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex animate-slide-up",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-5 py-3 transition-all duration-300",
                        message.role === "user"
                          ? "bg-gradient-primary text-primary-foreground shadow-glow"
                          : "bg-muted/50 backdrop-blur-sm text-foreground border border-border/30"
                      )}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                      <span className="text-xs opacity-60 mt-2 block">
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
                <div className="flex justify-start animate-slide-up">
                  <div className="bg-muted/50 backdrop-blur-sm border border-border/30 rounded-2xl px-5 py-3 flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm">KI denkt nach...</span>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-6 border-t border-border/50 bg-background/20 backdrop-blur-sm">
            <div className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Schreibe eine Nachricht..."
                disabled={isProcessing}
                className="flex-1 bg-background/50 border-border/50 focus:border-primary h-12 px-4 text-base"
              />
              <Button
                onClick={handleSend}
                disabled={isProcessing || !input.trim()}
                className="bg-gradient-primary hover:opacity-90 shadow-glow h-12 px-6"
                size="lg"
              >
                {isProcessing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    Senden
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Drücke Enter zum Senden • {getProviderLabel(provider)} aktiv{provider === 'groq' ? ` • Modell: ${model}` : ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};