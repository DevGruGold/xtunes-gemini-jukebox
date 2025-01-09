import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import { useState } from "react";
import { translateText } from "@/utils/ai";
import { useToast } from "@/hooks/use-toast";

interface NowPlayingProps {
  station?: {
    title: string;
    category: string;
  };
  lyrics?: string;
}

export const NowPlaying = ({ station, lyrics }: NowPlayingProps) => {
  const [translatedLyrics, setTranslatedLyrics] = useState<string>("");
  const [isTranslating, setIsTranslating] = useState(false);
  const { toast } = useToast();

  const translateLyrics = async () => {
    if (!lyrics) return;
    
    setIsTranslating(true);
    try {
      // In a production environment, you would get this from Supabase secrets
      const apiKey = localStorage.getItem('GEMINI_API_KEY') || '';
      
      if (!apiKey) {
        toast({
          title: "API Key Required",
          description: "Please set your Gemini API key in the settings.",
          variant: "destructive"
        });
        return;
      }

      const translated = await translateText(lyrics, apiKey);
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
        
        {lyrics && (
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
            <p className="text-white/70 whitespace-pre-line">{lyrics}</p>
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