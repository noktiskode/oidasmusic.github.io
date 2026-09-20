import { Music } from 'lucide-react';

interface AlbumArtProps {
  src: string | null;
  isPlaying: boolean;
}

export default function AlbumArt({ src, isPlaying }: AlbumArtProps) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[300px]">
      {/* Glow ring */}
      <div
        className={`absolute -inset-3 rounded-full bg-gradient-to-br from-emerald-400/30 via-teal-400/20 to-cyan-400/30 blur-2xl transition-opacity duration-500 ${
          isPlaying ? 'opacity-100' : 'opacity-40'
        }`}
      />
      {/* Rotating ring */}
      <div
        className={`absolute inset-0 rounded-full border border-white/10 ${
          isPlaying ? 'spin-slow' : ''
        }`}
      />
      <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-2xl ring-1 ring-white/10">
        {src ? (
          <img
            src={src}
            alt="Album cover"
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Music className="h-24 w-24 text-zinc-600" strokeWidth={1.2} />
          </div>
        )}
      </div>
    </div>
  );
}
