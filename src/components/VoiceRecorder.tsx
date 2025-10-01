import { useState, useRef, useEffect } from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  isProcessing: boolean;
}

export const VoiceRecorder = ({ onRecordingComplete, isProcessing }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Audio-Visualisierung einrichten
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const updateAudioLevel = () => {
        if (analyserRef.current && isRecording) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average / 255);
          requestAnimationFrame(updateAudioLevel);
        }
      };
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        onRecordingComplete(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        setAudioLevel(0);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      updateAudioLevel();
      
      toast({
        title: "Aufnahme gestartet",
        description: "Sprechen Sie klar und deutlich",
      });
    } catch (error) {
      console.error("Fehler beim Zugriff auf Mikrofon:", error);
      toast({
        title: "Fehler",
        description: "Konnte nicht auf Mikrofon zugreifen",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      toast({
        title: "Aufnahme beendet",
        description: "Ihre Spracheingabe wird verarbeitet...",
      });
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 py-12">
      {/* Audio level visualizer */}
      {isRecording && (
        <div className="flex items-center gap-2 mb-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-2 bg-primary rounded-full transition-all duration-150"
              style={{
                height: `${20 + audioLevel * 60 * (1 - Math.abs(i - 2) * 0.2)}px`,
                opacity: 0.3 + audioLevel * 0.7,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative">
        {/* Pulsing rings with improved effects */}
        {isRecording && (
          <>
            <div 
              className="absolute inset-0 rounded-full bg-voice-pulse opacity-20 animate-ping"
              style={{ 
                transform: `scale(${1 + audioLevel * 0.5})`,
                transition: "transform 0.1s ease-out"
              }}
            />
            <div 
              className="absolute inset-0 rounded-full bg-voice-pulse opacity-30"
              style={{ 
                transform: `scale(${1.2 + audioLevel * 0.3})`,
                transition: "transform 0.1s ease-out"
              }}
            />
            <div 
              className="absolute inset-0 rounded-full bg-gradient-primary opacity-10 blur-2xl"
              style={{ 
                transform: `scale(${1.5 + audioLevel * 0.4})`,
                transition: "transform 0.1s ease-out"
              }}
            />
          </>
        )}
        
        {/* Idle glow effect */}
        {!isRecording && !isProcessing && (
          <div className="absolute inset-0 bg-gradient-primary opacity-30 blur-3xl animate-pulse-glow" />
        )}
        
        <Button
          size="lg"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={cn(
            "relative h-32 w-32 rounded-full transition-all duration-500 group",
            isRecording
              ? "bg-destructive hover:bg-destructive/90 shadow-glow scale-110"
              : "bg-gradient-primary hover:opacity-90 shadow-glow hover:scale-110",
            isProcessing && "opacity-50 cursor-not-allowed"
          )}
        >
          {isRecording ? (
            <Square className="h-12 w-12 group-hover:scale-90 transition-transform" />
          ) : (
            <Mic className="h-12 w-12 group-hover:scale-110 transition-transform" />
          )}
        </Button>
      </div>

      <div className="text-center space-y-2 max-w-md">
        <p className="text-2xl font-bold text-foreground">
          {isRecording ? "Aufnahme läuft..." : "Bereit zum Aufnehmen"}
        </p>
        <p className="text-base text-muted-foreground">
          {isRecording 
            ? "Beschreiben Sie Ihre App klar und deutlich" 
            : "Klicken Sie auf den Button und beschreiben Sie Ihre App-Idee"}
        </p>
        {isRecording && (
          <p className="text-sm text-primary animate-pulse">
            🎤 Mikrofon ist aktiv
          </p>
        )}
      </div>
    </div>
  );
};
