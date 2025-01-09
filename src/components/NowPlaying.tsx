import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import { useState } from "react";

interface NowPlayingProps {
  station?: {
    title: string;
    category: string;
  };
  lyrics?: string;
}

export const NowPlaying = ({ station, lyrics }: NowPlayingProps) => {
  const [translatedLyrics, setTranslatedLyrics] = useState<string>("");

  const translateLyrics = async () => {
    // In a real app, we would call the Gemini API here
    setTranslatedLyrics("Translated lyrics would appear here...");
  };

  if (!station) return null;

  return (
    <Card className="backdrop-blur-sm bg-white/10 border-white/20 p-6">
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
              >
                <Languages className="w-4 h-4 mr-2" />
                Translate
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