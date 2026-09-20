import { formatTime } from '@/lib/player';

interface ProgressBarProps {
  current: number;
  duration: number;
  onSeek: (value: number) => void;
}

export default function ProgressBar({ current, duration, onSeek }: ProgressBarProps) {
  const pct = duration > 0 ? (current / duration) * 100 : 0;
  return (
    <div className="w-full">
      <div className="relative">
        <input
          type="range"
          className="slider"
          min={0}
          max={duration || 0}
          step={0.1}
          value={current}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          style={{
            background: `linear-gradient(to right, #34d399 0%, #34d399 ${pct}%, rgba(255,255,255,0.12) ${pct}%, rgba(255,255,255,0.12) 100%)`,
          }}
          aria-label="Seek"
        />
      </div>
      <div className="mt-1.5 flex justify-between text-xs font-medium text-zinc-400 tabular-nums">
        <span>{formatTime(current)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
