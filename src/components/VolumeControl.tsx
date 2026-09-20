import { Volume2, VolumeX, Volume1 } from 'lucide-react';

interface VolumeControlProps {
  volume: number;
  muted: boolean;
  onVolumeChange: (value: number) => void;
  onToggleMute: () => void;
}

export default function VolumeControl({
  volume,
  muted,
  onVolumeChange,
  onToggleMute,
}: VolumeControlProps) {
  const effective = muted ? 0 : volume;
  const pct = effective * 100;
  const Icon = muted || effective === 0 ? VolumeX : effective < 0.5 ? Volume1 : Volume2;

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onToggleMute}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-300 transition active:scale-90 hover:text-white"
        aria-label={muted ? 'Unmute' : 'Mute'}
      >
        <Icon className="h-5 w-5" />
      </button>
      <input
        type="range"
        className="slider flex-1"
        min={0}
        max={1}
        step={0.01}
        value={effective}
        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
        style={{
          background: `linear-gradient(to right, #34d399 0%, #34d399 ${pct}%, rgba(255,255,255,0.12) ${pct}%, rgba(255,255,255,0.12) 100%)`,
        }}
        aria-label="Volume"
      />
    </div>
  );
}
