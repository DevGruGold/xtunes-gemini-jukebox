
import { useState } from "react";
import { RadioCard } from "@/components/RadioCard";
import { NowPlaying } from "@/components/NowPlaying";
import { useIsMobile } from "@/hooks/use-mobile";
import { QuickTranslate } from "@/components/QuickTranslate";

const RADIO_STATIONS = [
  {
    id: 1,
    title: "Club Mix",
    category: "Hip-Hop",
    streamUrl: "https://strm112.1.fm/club_mobile_mp3",
  },
  {
    id: 2,
    title: "Smooth Jazz",
    category: "Jazz",
    streamUrl: "https://strm112.1.fm/smoothjazz_mobile_mp3",
  },
  {
    id: 3,
    title: "Classical Harmony",
    category: "Classical",
    streamUrl: "https://strm112.1.fm/classical_mobile_mp3",
  },
  {
    id: 4,
    title: "Electronic Beats",
    category: "Electronic",
    streamUrl: "https://strm112.1.fm/electronica_mobile_mp3",
  },
  {
    id: 5,
    title: "Reggae Vibes",
    category: "Reggae",
    streamUrl: "https://strm112.1.fm/reggae_mobile_mp3",
  },
  {
    id: 6,
    title: "Pop Hits",
    category: "Pop",
    streamUrl: "https://strm112.1.fm/top40_mobile_mp3",
  },
  {
    id: 7,
    title: "New Country",
    category: "Country",
    streamUrl: "https://strm112.1.fm/country_mobile_mp3",
  }
];

const Index = () => {
  const [currentStation, setCurrentStation] = useState<typeof RADIO_STATIONS[0] | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState(new Audio());
  const isMobile = useIsMobile();
  const [translationEnabled, setTranslationEnabled] = useState(false);

  const handleTogglePlay = (station: typeof RADIO_STATIONS[0]) => {
    if (currentStation?.id === station.id) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
      setIsPlaying(!isPlaying);
    } else {
      if (isPlaying) {
        audio.pause();
      }
      audio.src = station.streamUrl;
      audio.play();
      setCurrentStation(station);
      setIsPlaying(true);
    }
  };

  const handleToggleTranslation = (enabled: boolean) => {
    setTranslationEnabled(enabled);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/90 to-secondary/90">
      <div className="container px-4 py-8 mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white">XTunes Radio</h1>
          <QuickTranslate 
            audio={audio} 
            onToggle={handleToggleTranslation}
            enabled={translationEnabled}
          />
        </div>
        
        {currentStation && (
          <div className="mb-8">
            <NowPlaying 
              station={currentStation} 
              audio={audio} 
              translationEnabled={translationEnabled}
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {RADIO_STATIONS.map((station) => (
            <RadioCard
              key={station.id}
              title={station.title}
              category={station.category}
              streamUrl={station.streamUrl}
              isPlaying={isPlaying && currentStation?.id === station.id}
              onTogglePlay={() => handleTogglePlay(station)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
