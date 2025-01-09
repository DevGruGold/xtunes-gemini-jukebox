import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import { useState, useEffect } from "react";
import { translateText } from "@/utils/ai";
import { useToast } from "@/hooks/use-toast";

interface NowPlayingProps {
  station?: {
    title: string;
    category: string;
  };
}

export const NowPlaying = ({ station }: NowPlayingProps) => {
  const [translatedLyrics, setTranslatedLyrics] = useState<string>("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [currentLyrics, setCurrentLyrics] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    const fetchLyrics = async () => {
      if (!station) return;
      
      try {
        // For demonstration, we'll use some sample lyrics based on the genre
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

  const translateLyrics = async () => {
    if (!currentLyrics) return;
    
    setIsTranslating(true);
    try {
      const translated = await translateText(currentLyrics);
      if (translated) {
        setTranslatedLyrics(translated);
      }
    } finally {
      setIsTranslating(false);
    }
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
                onClick={translateLyrics}
                variant="outline"
                className="bg-white/10 hover:bg-white/20"
                disabled={isTranslating}
              >
                <Languages className="w-4 h-4 mr-2" />
                {isTranslating ? "Translating..." : "Translate"}
              </Button>
            </div>
            <p className="text-white/70 whitespace-pre-line">{currentLyrics}</p>
            {translatedLyrics && (
              <div className="mt-4">
                <h4 className="text-md font-semibold text-white mb-2">Translation</h4>
                <p className="text-white/70 whitespace-pre-line">{translatedLyrics}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};