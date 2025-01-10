import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import { useState, useEffect } from "react";
import { translateText as translate } from "@/utils/ai";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

interface NowPlayingProps {
  station?: {
    title: string;
    category: string;
  };
}

interface Translation {
  original: string;
  translated: string;
  timestamp: Date;
}

export const NowPlaying = ({ station }: NowPlayingProps) => {
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [currentLyrics, setCurrentLyrics] = useState<string>("");
  const [customText, setCustomText] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    const fetchLyrics = async () => {
      if (!station) return;
      
      try {
        const genreLyrics: { [key: string]: string } = {
          Jazz: "Smooth jazz playing softly\nMelodies floating through the air\nSaxophone whispers gently\nTaking away all my cares",
          Classical: "Symphony in motion\nOrchestra plays tonight\nStrings and brass in harmony\nCreating pure delight",
          Rock: "Electric guitar screaming\nDrums beating like thunder\nRock and roll forever\nTearing the night asunder",
          Electronic: "Digital waves surround us\nSynthesizers set the mood\nElectronic beats pulsing\nTechnology and groove",
          Reggae: "Island rhythms flowing\nSunset on the beach\nReggae music playing\nParadise within reach",
          Pop: "Dancing to the rhythm\nCatchy melodies in my head\nPop music got me moving\nFollowing where the beat led",
          "Hip-Hop": "Old school beats dropping\nNineties flow is smooth like wine\nGolden age of hip-hop\nRhymes that stand the test of time",
        };

        const lyrics = genreLyrics[station.category] || "Music playing...";
        setCurrentLyrics(lyrics);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch lyrics. Please try again later.",
          variant: "destructive",
        });
      }
    };

    fetchLyrics();
  }, [station, toast]);

  const handleTranslation = async (text: string) => {
    if (!text) return;
    
    setIsTranslating(true);
    try {
      const translated = await translate(text);
      if (translated) {
        const newTranslation: Translation = {
          original: text,
          translated,
          timestamp: new Date(),
        };
        setTranslations(prev => [...prev, newTranslation]);
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

  const handleTranslateLyrics = () => handleTranslation(currentLyrics);
  const handleTranslateCustom = () => {
    handleTranslation(customText);
    setCustomText("");
  };

  if (!station) return null;

  return (
    <Card className="backdrop-blur-sm bg-white/10 border-white/20 p-6 w-full max-w-2xl mx-auto">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Now Playing</h2>
          <p className="text-white/70">{station.title}</p>
          <p className="text-sm text-white/50">{station.category}</p>
        </div>
        
        {currentLyrics && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Lyrics</h3>
              <Button
                onClick={handleTranslateLyrics}
                variant="outline"
                className="bg-white/10 hover:bg-white/20"
                disabled={isTranslating}
              >
                <Languages className="w-4 h-4 mr-2" />
                {isTranslating ? "Translating..." : "Translate Lyrics"}
              </Button>
            </div>
            <p className="text-white/70 whitespace-pre-line">{currentLyrics}</p>
          </div>
        )}

        <div className="space-y-2 mt-4">
          <h3 className="text-lg font-semibold text-white">Conversation</h3>
          <div className="flex gap-2">
            <Textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Type anything to translate..."
              className="bg-white/10 border-white/20 text-white"
            />
            <Button
              onClick={handleTranslateCustom}
              variant="outline"
              className="bg-white/10 hover:bg-white/20"
              disabled={isTranslating || !customText}
            >
              <Languages className="w-4 h-4 mr-2" />
              Translate
            </Button>
          </div>
        </div>

        {translations.length > 0 && (
          <div className="space-y-4 mt-4">
            <h3 className="text-lg font-semibold text-white">Translation History</h3>
            <div className="space-y-4">
              {translations.map((t, i) => (
                <div key={i} className="bg-white/5 p-4 rounded-lg space-y-2">
                  <p className="text-white/70">{t.original}</p>
                  <p className="text-white font-medium">{t.translated}</p>
                  <p className="text-xs text-white/50">
                    {t.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};