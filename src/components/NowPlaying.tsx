import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Languages, Mic, MicOff } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { translateText as translate } from "@/utils/ai";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

interface NowPlayingProps {
  station?: {
    title: string;
    category: string;
  };
  audio?: HTMLAudioElement;
}

interface Translation {
  original: string;
  translated: string;
  timestamp: Date;
  sourceLang?: string;
}

const getBackgroundStyle = (category: string): { backgroundImage: string, overlayColor: string } => {
  const backgrounds = {
    "Hip-Hop": {
      image: "https://images.unsplash.com/photo-1527576539890-dfa815648363",
      overlay: "from-purple-900/80 to-blue-900/80"
    },
    "Jazz": {
      image: "https://images.unsplash.com/photo-1500673922987-e212871fec22",
      overlay: "from-amber-900/80 to-red-900/80"
    },
    "Classical": {
      image: "https://images.unsplash.com/photo-1487958449943-2429e8be8625",
      overlay: "from-slate-900/80 to-zinc-900/80"
    },
    "Electronic": {
      image: "https://images.unsplash.com/photo-1470813740244-df37b8c1edcb",
      overlay: "from-cyan-900/80 to-blue-900/80"
    },
    "Reggae": {
      image: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21",
      overlay: "from-green-900/80 to-yellow-900/80"
    },
    "Pop": {
      image: "https://images.unsplash.com/photo-1582562124811-c09040d0a901",
      overlay: "from-pink-900/80 to-purple-900/80"
    },
    "Country": {
      image: "https://images.unsplash.com/photo-1721322800607-8c38375eef04",
      overlay: "from-amber-900/80 to-brown-900/80"
    }
  };

  const defaultStyle = {
    image: "https://images.unsplash.com/photo-1470813740244-df37b8c1edcb",
    overlay: "from-slate-900/80 to-zinc-900/80"
  };

  const style = backgrounds[category] || defaultStyle;
  return {
    backgroundImage: `url(${style.image})`,
    overlayColor: style.overlay
  };
};

export const NowPlaying = ({ station, audio }: NowPlayingProps) => {
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [autoTranslateEnabled, setAutoTranslateEnabled] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();
  const background = station ? getBackgroundStyle(station.category) : null;
  const originalVolume = useRef(audio?.volume || 1);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: "Speech Recognition Unavailable",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive",
      });
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = selectedLanguage;

    recognitionRef.current.onresult = async (event: any) => {
      const last = event.results.length - 1;
      const text = event.results[last][0].transcript;
      
      if (event.results[last].isFinal) {
        const detectedLang = event.results[last].lang;
        if (detectedLang !== selectedLanguage && event.results[last][0].confidence > 0.5) {
          handleTranslation(text, detectedLang);
        }
      }
    };

    recognitionRef.current.onstart = () => {
      if (audio) {
        originalVolume.current = audio.volume;
        audio.volume = 0.2;
      }
      setIsListening(true);
      toast({
        title: "Translation Mode Active",
        description: "Listening for speech to translate...",
      });
    };

    recognitionRef.current.onend = () => {
      if (audio) {
        audio.volume = originalVolume.current;
      }
      if (autoTranslateEnabled) {
        recognitionRef.current.start();
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      toast({
        title: "Speech Recognition Error",
        description: event.error,
        variant: "destructive",
      });
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [selectedLanguage]);

  const handleTranslation = async (text: string, sourceLang?: string) => {
    if (!text) return;
    
    setIsTranslating(true);
    try {
      const translated = await translate(text);
      if (translated) {
        const newTranslation: Translation = {
          original: text,
          translated,
          timestamp: new Date(),
          sourceLang
        };
        setTranslations(prev => [newTranslation, ...prev].slice(0, 10)); // Keep last 10 translations
      }
    } catch (error) {
      toast({
        title: "Translation Error",
        description: "Failed to translate the text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const toggleListening = async () => {
    if (!recognitionRef.current) return;

    if (!isListening) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        recognitionRef.current.start();
        setAutoTranslateEnabled(true);
      } catch (error) {
        toast({
          title: "Microphone Access Denied",
          description: "Please allow microphone access to use translation.",
          variant: "destructive",
        });
      }
    } else {
      recognitionRef.current.stop();
      setAutoTranslateEnabled(false);
      setIsListening(false);
    }
  };

  if (!station) return null;

  return (
    <Card 
      className="relative overflow-hidden backdrop-blur-sm border-white/20 p-6 w-full max-w-2xl mx-auto"
      style={{
        backgroundImage: background?.backgroundImage,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${background?.overlayColor}`} />
      <div className="relative z-10 space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Now Playing</h2>
          <p className="text-white/70">{station.title}</p>
          <p className="text-sm text-white/50">{station.category}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Live Translation</h3>
            <Button
              onClick={toggleListening}
              variant="outline"
              className={`bg-white/10 hover:bg-white/20 ${isListening ? 'text-red-400' : 'text-white'}`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
          </div>
          
          <div className="text-sm text-white/70">
            {isListening ? "Translation mode active" : "Click microphone to start translation"}
          </div>
        </div>

        {translations.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Recent Translations</h3>
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {translations.map((t, i) => (
                <div key={i} className="bg-white/5 p-4 rounded-lg space-y-2">
                  <p className="text-white/70">{t.original}</p>
                  <p className="text-white font-medium">{t.translated}</p>
                  <div className="flex justify-between items-center text-xs text-white/50">
                    <span>{t.timestamp.toLocaleTimeString()}</span>
                    {t.sourceLang && <span>From: {t.sourceLang}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};