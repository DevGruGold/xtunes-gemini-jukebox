import { useState, useEffect, useRef } from "react";
import { Switch } from "@/components/ui/switch";
import { Globe, Mic, MicOff, Users } from "lucide-react";
import { translateText, identifySong } from "@/utils/ai";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface QuickTranslateProps {
  audio?: HTMLAudioElement;
  onToggle: (enabled: boolean) => void;
  enabled: boolean;
  micPermissionGranted: boolean | null;
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
  { code: 'pt-BR', name: 'Portuguese (Brazil)' },
  { code: 'ru-RU', name: 'Russian' },
  { code: 'ar-SA', name: 'Arabic' },
  { code: 'hi-IN', name: 'Hindi' },
];

export const QuickTranslate = ({ audio, onToggle, enabled, micPermissionGranted }: QuickTranslateProps) => {
  const [isListening, setIsListening] = useState(false);
  const [userLanguage, setUserLanguage] = useState('en-US');
  const [multiParticipantMode, setMultiParticipantMode] = useState(false);
  const [detectedSpeakers, setDetectedSpeakers] = useState<Set<string>>(new Set());
  const [translationDelay, setTranslationDelay] = useState<number>(200); // Milliseconds
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const { toast } = useToast();
  const originalVolume = useRef(audio?.volume || 1);
  const [lastWarningTime, setLastWarningTime] = useState<number>(0);
  const WARNING_COOLDOWN = 10000; // 10 seconds between warnings
  const translationQueue = useRef<{text: string, sourceLang?: string}[]>([]);
  const isTranslating = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const startTimeRef = useRef<number>(0);
  
  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    
    // Initialize audio context for voice analysis
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 2048;
      }
    } catch (error) {
      console.error('Failed to initialize AudioContext:', error);
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
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
  }, [enabled, userLanguage, multiParticipantMode]);

  // Process translation queue
  useEffect(() => {
    const processQueue = async () => {
      if (translationQueue.current.length > 0 && !isTranslating.current) {
        isTranslating.current = true;
        const item = translationQueue.current.shift();
        
        if (item) {
          try {
            const translated = await translateText(item.text, item.sourceLang, userLanguage.split('-')[0]);
            if (translated) {
              speakTranslation(translated);
            }
          } catch (error) {
            console.error('Translation failed:', error);
          } finally {
            isTranslating.current = false;
            processQueue(); // Process next item in queue
          }
        }
      }
    };

    const interval = setInterval(processQueue, 100);
    return () => clearInterval(interval);
  }, [userLanguage]);

  const calculateTranslationSpeed = (text: string) => {
    const endTime = performance.now();
    const processingTime = endTime - startTimeRef.current;
    const wordsPerMinute = (text.split(' ').length / processingTime) * 60000;
    
    console.log(`Translation speed: ${processingTime.toFixed(2)}ms (${wordsPerMinute.toFixed(2)} words/min)`);
    
    // Adaptive delay based on processing time
    setTranslationDelay(Math.max(50, Math.min(500, processingTime / 2)));
  };

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
    recognitionRef.current.maxAlternatives = 3; // Get multiple alternatives for better accuracy

    recognitionRef.current.onresult = async (event: SpeechRecognitionEvent) => {
      const last = event.results.length - 1;
      const result = event.results[last];
      const text = result[0].transcript;
      const confidence = result[0].confidence;
      
      // Determine the detected language - this is a workaround since not all browsers
      // provide the language information in the SpeechRecognitionResult
      const detectedLang = userLanguage.split('-')[0]; // Default to user language
      const userLang = userLanguage.split('-')[0];
      
      if (result.isFinal && confidence > 0.5) {
        const now = Date.now();
        
        // Analyze audio characteristics to detect different speakers
        if (multiParticipantMode && analyserRef.current) {
          const bufferLength = analyserRef.current.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyserRef.current.getByteFrequencyData(dataArray);
          
          // Simple frequency analysis to estimate speaker characteristics
          const speakerSignature = Array.from(dataArray.slice(0, 10)).join('-');
          setDetectedSpeakers(prev => new Set(prev).add(speakerSignature));
        }
        
        if (detectedLang === userLang || !detectedLang) {
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
          
          // Start timing for translation speed measurement
          startTimeRef.current = performance.now();
          
          // For near-instant translation, add to queue immediately
          if (multiParticipantMode) {
            // In multi-participant mode, translate immediately
            translationQueue.current.push({ text, sourceLang: detectedLang });
          } else {
            // In standard mode, ask user unless auto-translation is enabled
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
          
          // Try to identify if it's a song
          identifySong(text).then(songInfo => {
            if (songInfo) {
              toast({
                title: "Song Identified",
                description: songInfo,
              });
            }
          }).catch(error => {
            console.error('Song identification failed:', error);
          });
        }
      } else if (!result.isFinal && confidence > 0.8 && multiParticipantMode) {
        // For multi-participant mode, provide interim translations for longer sentences
        const interimText = text;
        const words = interimText.split(' ');
        
        if (words.length > 5) {
          // Only queue for translation if we have a meaningful segment
          const debounceDelay = translationDelay;
          clearTimeout(window.setTimeout(() => {}, 0)); // Clear any pending timeouts
          
          setTimeout(() => {
            translationQueue.current.push({ text: interimText, sourceLang: detectedLang });
          }, debounceDelay);
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

    recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      toast({
        title: "Speech Recognition Error",
        description: event.error,
        variant: "destructive",
      });
    };
    
    // Start recognition if permission is already granted
    if (micPermissionGranted) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Failed to start recognition:', error);
      }
    } else {
      // Don't start - wait for permission
      toast({
        title: "Microphone Access Required",
        description: "Please enable microphone access to use translation features.",
        duration: 5000,
      });
    }
  };

  const speakTranslation = (text: string) => {
    if (!synthRef.current) return;
    
    // Calculate translation speed for analytics
    calculateTranslationSpeed(text);
    
    // Stop any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = userLanguage;
    utterance.rate = 1.1; // Slightly faster for more natural conversation flow
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    synthRef.current.speak(utterance);
  };

  const handleTranslation = async (text: string, sourceLang?: string) => {
    if (!text) return;
    
    try {
      const translated = await translateText(text, sourceLang, userLanguage.split('-')[0]);
      if (translated) {
        speakTranslation(translated);
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
    onToggle(checked);
    
    if (checked && micPermissionGranted) {
      // If permission is already granted, we can start immediately
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.error('Failed to start recognition:', error);
        }
      } else {
        prepareRecognition();
      }
    } else if (!checked && recognitionRef.current) {
      // If turning off, just stop listening
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleMultiParticipantMode = () => {
    setMultiParticipantMode(!multiParticipantMode);
    
    toast({
      title: !multiParticipantMode ? "Multi-Participant Mode Enabled" : "Multi-Participant Mode Disabled",
      description: !multiParticipantMode 
        ? "Automatic translation active for all detected languages" 
        : "Standard translation mode activated",
    });
  };

  return (
    <div className="flex flex-col gap-2 py-2 px-4 rounded-lg bg-white/10 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-white" />
          <span className="text-sm font-medium text-white">XTunes Translator Pro</span>
        </div>
        
        <div className="flex items-center gap-4">
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
      </div>
      
      {enabled && (
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`px-2 py-1 h-auto text-xs ${multiParticipantMode ? 'bg-white/20' : 'bg-transparent'}`}
              onClick={toggleMultiParticipantMode}
              disabled={!micPermissionGranted}
            >
              <Users className="h-3.5 w-3.5 mr-1" />
              Multi-participant
            </Button>
            
            {multiParticipantMode && detectedSpeakers.size > 0 && (
              <Badge variant="outline" className="text-xs bg-white/5 border-white/20 text-white">
                {detectedSpeakers.size} speakers
              </Badge>
            )}
          </div>
          
          <div className="text-xs text-white/70">
            {isListening ? 
              <span className="text-green-400 flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-green-400 animate-ping"></span>
                Active
              </span> : 
              micPermissionGranted === false ? 
              <span className="text-red-400">Permission denied</span> :
              "Disabled"}
          </div>
        </div>
      )}
    </div>
  );
};
