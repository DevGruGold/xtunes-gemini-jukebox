import { useState } from "react";
import { RadioCard } from "@/components/RadioCard";
import { NowPlaying } from "@/components/NowPlaying";
import { useIsMobile } from "@/hooks/use-mobile";

const RADIO_STATIONS = [
  {
    id: 1,
    title: "Smooth Jazz",
    category: "Jazz",
    streamUrl: "https://streaming.radio.co/s774887f7b/listen",
  },
  {
    id: 2,
    title: "Classical Harmony",
    category: "Classical",
    streamUrl: "https://streaming.radio.co/s774887f7b/listen",
  },
  {
    id: 3,
    title: "Rock Legends",
    category: "Rock",
    streamUrl: "https://streaming.radio.co/s774887f7b/listen",
  },
  {
    id: 4,
    title: "Electronic Beats",
    category: "Electronic",
    streamUrl: "https://streaming.radio.co/s774887f7b/listen",
  },
];

const Index = () => {
  const [currentStation, setCurrentStation] = useState<typeof RADIO_STATIONS[0] | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState(new Audio());
  const isMobile = useIsMobile();

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/90 to-secondary/90">
      <div className="container px-4 py-8 mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">XTunes Radio</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
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

        {currentStation && (
          <NowPlaying
            station={currentStation}
            lyrics="Sample lyrics would appear here..."
          />
        )}
      </div>
    </div>
  );
};

export default Index;