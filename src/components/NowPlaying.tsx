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

export const NowPlaying = ({ station }: NowPlayingProps) => {
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [customText, setCustomText] = useState<string>("");
  const { toast } = useToast();
  const background = station ? getBackgroundStyle(station.category) : null;

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

  const handleTranslateCustom = () => {
    handleTranslation(customText);
    setCustomText("");
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