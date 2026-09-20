import { Pause, Play, SkipBack, SkipForward, Shuffle, Repeat, Repeat1 } from 'lucide-react';
import type { RepeatMode } from '@/lib/player';

interface ControlsProps {
  isPlaying: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
}

export default function Controls({
  isPlaying,
  shuffle,
  repeat,
  onPlayPause,
  onPrev,
  onNext,
  onToggleShuffle,
  onCycleRepeat,
}: ControlsProps) {
  const RepeatIcon = repeat === 'one' ? Repeat1 : Repeat;

  return (
    <div className="flex items-center justify-center gap-5">
      <button
        onClick={onToggleShuffle}
        className={`flex h-11 w-11 items-center justify-center rounded-full transition active:scale-90 ${
          shuffle ? 'text-emerald-400' : 'text-zinc-400 hover:text-white'
        }`}
        aria-label="Shuffle"
      >
        <Shuffle className="h-5 w-5" />
      </button>

      <button
        onClick={onPrev}
        className="flex h-12 w-12 items-center justify-center rounded-full text-white transition active:scale-90 hover:text-emerald-300"
        aria-label="Previous"
      >
        <SkipBack className="h-7 w-7 fill-current" />
      </button>

      <button
        onClick={onPlayPause}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-zinc-900 shadow-lg shadow-emerald-500/30 transition active:scale-95"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <Pause className="h-7 w-7 fill-current" />
        ) : (
          <Play className="h-7 w-7 translate-x-0.5 fill-current" />
        )}
      </button>

      <button
        onClick={onNext}
        className="flex h-12 w-12 items-center justify-center rounded-full text-white transition active:scale-90 hover:text-emerald-300"
        aria-label="Next"
      >
        <SkipForward className="h-7 w-7 fill-current" />
      </button>

      <button
        onClick={onCycleRepeat}
        className={`flex h-11 w-11 items-center justify-center rounded-full transition active:scale-90 ${
          repeat !== 'off' ? 'text-emerald-400' : 'text-zinc-400 hover:text-white'
        }`}
        aria-label="Repeat"
      >
        <RepeatIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
