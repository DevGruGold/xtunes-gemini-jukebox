import { Card } from "@/components/ui/card";
import { Play, Pause } from "lucide-react";

interface RadioCardProps {
  title: string;
  category: string;
  streamUrl: string;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export const RadioCard = ({
  title,
  category,
  streamUrl,
  isPlaying,
  onTogglePlay,
}: RadioCardProps) => {
  return (
    <Card className="group relative overflow-hidden backdrop-blur-sm bg-white/10 border-white/20 hover:bg-white/20 transition-all duration-300">
      <div className="p-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-sm text-white/70">{category}</p>
          </div>
          <button
            onClick={onTogglePlay}
            className="p-3 rounded-full bg-primary hover:bg-primary/80 transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-white" />
            ) : (
              <Play className="w-6 h-6 text-white" />
            )}
          </button>
        </div>
      </div>
    </Card>
  );
};