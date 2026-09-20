import { Music, ListMusic, Trash2 } from 'lucide-react';
import type { Track } from '@/lib/player';

interface PlaylistProps {
  tracks: Track[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onClear: () => void;
}

export default function Playlist({ tracks, currentIndex, onSelect, onClear }: PlaylistProps) {
  if (tracks.length === 0) return null;

  return (
    <div className="rounded-2xl bg-white/[0.04] ring-1 ring-white/10">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
          <ListMusic className="h-4 w-4 text-emerald-400" />
          Lista de reproducción
          <span className="text-xs font-normal text-zinc-500">({tracks.length})</span>
        </div>
        <button
          onClick={onClear}
          className="flex items-center gap-1 text-xs text-zinc-500 transition hover:text-red-400 active:scale-95"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Limpiar
        </button>
      </div>
      <div className="scroll-thin max-h-[220px] overflow-y-auto px-2 pb-2">
        {tracks.map((track, i) => {
          const active = i === currentIndex;
          return (
            <button
              key={track.id}
              onClick={() => onSelect(i)}
              className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition ${
                active ? 'bg-emerald-400/10 ring-1 ring-emerald-400/30' : 'hover:bg-white/5'
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-800">
                {track.albumArtUrl ? (
                  <img
                    src={track.albumArtUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <Music className="h-4 w-4 text-zinc-600" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-sm font-medium ${
                    active ? 'text-emerald-300' : 'text-zinc-200'
                  }`}
                >
                  {track.title}
                </p>
                <p className="truncate text-xs text-zinc-500">{track.artist}</p>
              </div>
              {active && (
                <div className="flex h-4 items-end gap-0.5">
                  {[0, 1, 2].map((b) => (
                    <span
                      key={b}
                      className="eq-bar w-0.5 rounded-full bg-emerald-400"
                      style={{ height: '100%', animationDelay: `${b * 0.15}s` }}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
