import { useState, useRef, useEffect } from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
      
      // Set up audio visualization
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
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        {/* Pulsing rings */}
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
          </>
        )}
        
        <Button
          size="lg"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={cn(
            "relative h-24 w-24 rounded-full transition-all duration-300",
            isRecording
              ? "bg-destructive hover:bg-destructive/90 shadow-glow"
              : "bg-gradient-primary hover:opacity-90 shadow-glow animate-pulse-glow"
          )}
        >
          {isRecording ? (
            <Square className="h-8 w-8" />
          ) : (
            <Mic className="h-8 w-8" />
          )}
        </Button>
      </div>

      <div className="text-center">
        <p className="text-lg font-medium text-foreground">
          {isRecording ? "Aufnahme läuft..." : "Drücke um aufzunehmen"}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {isRecording 
            ? "Beschreibe deine App mit deiner Stimme" 
            : "Sage mir, welche App du erstellen möchtest"}
        </p>
      </div>
    </div>
  );
};
