import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const RealtimeVoiceChat = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.autoplay = true;
    
    return () => {
      disconnect();
    };
  }, []);

  const connect = async () => {
    try {
      // Hole Ephemeral Token vom Backend
      const { data, error } = await supabase.functions.invoke('realtime-voice', {
        body: { action: 'create-session' }
      });

      if (error) throw error;

      const ephemeralToken = data.client_secret.value;

      // Erstelle RTCPeerConnection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Audio-Track hinzufügen
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      
      pc.addTrack(stream.getTracks()[0]);

      // Remote Audio Setup
      pc.ontrack = (e) => {
        if (audioRef.current) {
          audioRef.current.srcObject = e.streams[0];
        }
      };

      // Data Channel für Events
      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;

      dc.onmessage = (e) => {
        const event = JSON.parse(e.data);
        handleRealtimeEvent(event);
      };

      // Erstelle Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Verbinde mit OpenAI Realtime API
      const response = await fetch(
        'https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17',
        {
          method: 'POST',
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${ephemeralToken}`,
            'Content-Type': 'application/sdp'
          }
        }
      );

      const answerSdp = await response.text();
      await pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp
      });

      setIsConnected(true);
      toast({
        title: 'Verbunden',
        description: 'Voice-Chat ist bereit!'
      });

    } catch (error) {
      console.error('Verbindungsfehler:', error);
      toast({
        title: 'Verbindungsfehler',
        description: error instanceof Error ? error.message : 'Unbekannter Fehler',
        variant: 'destructive'
      });
    }
  };

  const disconnect = () => {
    dcRef.current?.close();
    pcRef.current?.close();
    setIsConnected(false);
    setIsSpeaking(false);
  };

  const handleRealtimeEvent = (event: any) => {
    console.log('Realtime Event:', event);

    switch (event.type) {
      case 'conversation.item.created':
        if (event.item.type === 'message') {
          const content = event.item.content?.[0]?.transcript || event.item.content?.[0]?.text;
          if (content) {
            setMessages(prev => [...prev, {
              role: event.item.role,
              content,
              timestamp: new Date()
            }]);
          }
        }
        break;
      
      case 'response.audio.delta':
        setIsSpeaking(true);
        break;
      
      case 'response.audio.done':
        setIsSpeaking(false);
        break;

      case 'input_audio_buffer.speech_started':
        console.log('Nutzer spricht...');
        break;

      case 'input_audio_buffer.speech_stopped':
        console.log('Nutzer hat aufgehört zu sprechen');
        break;
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-8">
      <div className="relative">
        <div className={`absolute inset-0 rounded-full blur-3xl transition-opacity duration-500 ${
          isSpeaking ? 'opacity-100 animate-pulse' : 'opacity-0'
        }`} style={{
          background: 'radial-gradient(circle, var(--gradient-start) 0%, var(--gradient-end) 100%)'
        }} />
        
        <Button
          onClick={isConnected ? disconnect : connect}
          size="lg"
          className={`relative z-10 w-24 h-24 rounded-full transition-all duration-300 ${
            isConnected 
              ? 'bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500' 
              : 'bg-primary/20 hover:bg-primary/30 border-2 border-primary'
          }`}
        >
          {isConnected ? (
            <MicOff className="w-10 h-10" />
          ) : (
            <Mic className="w-10 h-10" />
          )}
        </Button>
      </div>

      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">
          {isConnected ? 'Voice-Chat aktiv' : 'Voice-Chat starten'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {isConnected 
            ? 'Sprechen Sie einfach los...' 
            : 'Klicken Sie, um den Voice-Chat zu starten'}
        </p>
      </div>

      {isSpeaking && (
        <div className="flex items-center gap-2 text-primary animate-pulse">
          <Volume2 className="w-5 h-5" />
          <span>KI spricht...</span>
        </div>
      )}

      {messages.length > 0 && (
        <div className="w-full max-w-2xl space-y-4 mt-6">
          <h4 className="text-lg font-semibold">Gesprächsverlauf</h4>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-primary/10 ml-8'
                    : 'bg-secondary/50 mr-8'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="font-semibold text-sm">
                    {msg.role === 'user' ? 'Sie' : 'KI'}
                  </div>
                  <div className="flex-1 text-sm">{msg.content}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
