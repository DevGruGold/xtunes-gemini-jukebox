
import { useState, useEffect, useRef } from "react";
import { Switch } from "@/components/ui/switch";
import { Globe, Mic, MicOff } from "lucide-react";
import { translateText, identifySong } from "@/utils/ai";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface QuickTranslateProps {
  audio?: HTMLAudioElement;
  onToggle: (enabled: boolean) => void;
  enabled: boolean;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'es-ES', name: 'Spanish' },
  { code: 'fr-FR', name: 'French' },
  { code: 'de-DE', name: 'German' },
  { code: 'it-IT', name: 'Italian' },
  { code: 'ja-JP', name: 'Japanese' },
  { code: 'ko-KR', name: 'Korean' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
];

export const QuickTranslate = ({ audio, onToggle, enabled }: QuickTranslateProps) => {
  const [isListening, setIsListening] = useState(false);
  const [userLanguage, setUserLanguage] = useState('en-US');
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const { toast } = useToast();
  const originalVolume = useRef(audio?.volume || 1);
  const [lastWarningTime, setLastWarningTime] = useState<number>(0);
  const WARNING_COOLDOWN = 10000; // 10 seconds between warnings
  
  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    // Only initialize speech recognition if the user has explicitly enabled it
    if (enabled) {
      // We'll prepare the recognition setup but not start it immediately
      prepareRecognition();
    } else if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [enabled, userLanguage]);

  // This function prepares the recognition but doesn't start it until permission is granted
  const prepareRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: "Speech Recognition Unavailable",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive",
      });
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = userLanguage;

    recognitionRef.current.onresult = async (event: any) => {
      const last = event.results.length - 1;
      const text = event.results[last][0].transcript;
      const confidence = event.results[last][0].confidence;
      const detectedLang = event.results[last][0].lang?.split('-')[0];
      const userLang = userLanguage.split('-')[0];
      
      if (event.results[last].isFinal && confidence > 0.5) {
        const now = Date.now();
        
        if (detectedLang === userLang) {
          // User is speaking their native language
          if (now - lastWarningTime > WARNING_COOLDOWN) {
            if (audio) {
              audio.volume = 0.2;
            }
            toast({
              title: "Voice Detected",
              description: "The music has been lowered. Please keep your voice down to enjoy the music.",
            });
            setLastWarningTime(now);
            
            // Restore volume after 5 seconds
            setTimeout(() => {
              if (audio) {
                audio.volume = originalVolume.current;
              }
            }, 5000);
          }
        } else {
          // Foreign language detected
          if (audio) {
            audio.volume = 0.2;
          }
          
          toast({
            title: "Foreign Language Detected",
            description: "Would you like to translate this conversation?",
            action: (
              <Button
                onClick={() => handleTranslation(text, detectedLang)}
                variant="outline"
                size="sm"
                className="bg-white/10 hover:bg-white/20 text-white"
              >
                Translate
              </Button>
            ),
            duration: 5000,
          });
        }
      }
    };

    recognitionRef.current.onstart = () => {
      if (audio) {
        originalVolume.current = audio.volume;
      }
      setIsListening(true);
      toast({
        title: "Translation Mode Active",
        description: `Listening for non-${SUPPORTED_LANGUAGES.find(l => l.code === userLanguage)?.name} speech...`,
      });
    };

    recognitionRef.current.onend = () => {
      if (enabled) {
        // Only restart if still enabled
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.error('Failed to restart recognition:', error);
        }
      } else {
        setIsListening(false);
        if (audio) {
          audio.volume = originalVolume.current;
        }
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
    
    // Don't automatically start recognition - wait for user to request it
    // This moves the permission prompt to a user-initiated action
    if (enabled) {
      startRecognition();
    }
  };

  // Explicitly request microphone access when the user enables the feature
  const startRecognition = async () => {
    if (!recognitionRef.current) return;
    
    try {
      // Show a toast to inform the user that we're requesting permission
      toast({
        title: "Microphone Access",
        description: "Please allow microphone access in the browser prompt to use translation features.",
      });
      
      // Request microphone permission explicitly with a user-initiated action
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Only start recognition after permission is granted
      recognitionRef.current.start();
    } catch (error) {
      console.error('Microphone access denied:', error);
      onToggle(false); // Turn off the feature if permission is denied
      toast({
        title: "Microphone Access Denied",
        description: "Translation feature has been disabled. Enable it again and allow microphone access to use translation.",
        variant: "destructive",
      });
    }
  };

  const speakTranslation = (text: string) => {
    if (!synthRef.current) return;
    
    // Stop any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = userLanguage;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    synthRef.current.speak(utterance);
  };

  const handleTranslation = async (text: string, sourceLang?: string) => {
    if (!text) return;
    
    try {
      const translated = await translateText(text);
      if (translated) {
        speakTranslation(translated);
        
        // Try to identify the song when we get new lyrics
        const songInfo = await identifySong(text);
        if (songInfo) {
          toast({
            title: "Song Identified",
            description: songInfo,
          });
        }
      }
    } catch (error) {
      toast({
        title: "Translation Error",
        description: "Failed to translate the text. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Restore volume after translation
      setTimeout(() => {
        if (audio) {
          audio.volume = originalVolume.current;
        }
      }, 5000);
    }
  };

  const handleToggle = (checked: boolean) => {
    if (checked) {
      // If turning on, we need to make sure this is a user gesture to request permissions
      onToggle(checked);
    } else {
      // If turning off, just stop listening
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      onToggle(checked);
    }
  };

  return (
    <div className="flex items-center gap-4 py-2 px-4 rounded-lg bg-white/10 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Globe className="h-5 w-5 text-white" />
        <span className="text-sm font-medium text-white">Quick Translate</span>
      </div>
      
      <Select
        value={userLanguage}
        onValueChange={setUserLanguage}
        disabled={!enabled}
      >
        <SelectTrigger className="w-[140px] h-8 bg-white/10 border-white/20 text-white text-xs">
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <div className="flex items-center gap-2">
        <Switch 
          checked={enabled}
          onCheckedChange={handleToggle}
        />
        {enabled ? 
          <Mic className={`h-4 w-4 ${isListening ? "text-green-400 animate-pulse" : "text-white"}`} /> :
          <MicOff className="h-4 w-4 text-white" />
        }
      </div>
    </div>
  );
};
