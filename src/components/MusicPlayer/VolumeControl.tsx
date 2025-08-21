import React from 'react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

export const VolumeControl: React.FC = () => {
  const { volume, isMuted, setVolume, toggleMute } = useMusicPlayer();

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return VolumeX;
    if (volume < 0.5) return Volume1;
    return Volume2;
  };

  const VolumeIcon = getVolumeIcon();

  const handleVolumeChange = (values: number[]) => {
    setVolume(values[0]);
  };

  return (
    <div className="flex items-center gap-2 w-24">
      <button
        onClick={toggleMute}
        className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        <VolumeIcon className="w-4 h-4" />
      </button>

      <Slider
        value={[isMuted ? 0 : volume]}
        onValueChange={handleVolumeChange}
        max={1}
        step={0.1}
        className="flex-1"
        aria-label="Volume"
      />
    </div>
  );
};