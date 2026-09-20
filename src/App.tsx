import { useCallback, useEffect, useRef, useState } from 'react';
import { FolderOpen, Music4 } from 'lucide-react';
import AlbumArt from '@/components/AlbumArt';
import ProgressBar from '@/components/ProgressBar';
import VolumeControl from '@/components/VolumeControl';
import Controls from '@/components/Controls';
import Playlist from '@/components/Playlist';
import {
  deriveTitle,
  pictureToDataUrl,
  readTags,
  type RepeatMode,
  type Track,
} from '@/lib/player';

function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('off');

  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentTrack = currentIndex >= 0 ? tracks[currentIndex] : null;

  // Load track into audio element when index changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    audio.src = currentTrack.url;
    audio.load();
    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, tracks]);

  // Sync volume / mute
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = muted;
    }
  }, [volume, muted]);

  const playIndex = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsPlaying(true);
  }, []);

  const togglePlayPause = useCallback(() => {
    if (!currentTrack) return;
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [isPlaying, currentTrack]);

  const pickNext = useCallback(
    (auto: boolean) => {
      if (tracks.length === 0) return;
      // Repeat one on auto-advance replays the same track
      if (auto && repeat === 'one') {
        const audio = audioRef.current;
        if (audio) {
          audio.currentTime = 0;
          audio.play().catch(() => {});
        }
        return;
      }
      if (shuffle) {
        if (tracks.length === 1) {
          if (repeat === 'one') {
            const audio = audioRef.current;
            if (audio) {
              audio.currentTime = 0;
              audio.play().catch(() => {});
            }
            return;
          }
          if (repeat === 'off' && auto) {
            setIsPlaying(false);
            return;
          }
          // repeat all with one track: just replay
          const audio = audioRef.current;
          if (audio) {
            audio.currentTime = 0;
            audio.play().catch(() => {});
          }
          return;
        }
        let next = Math.floor(Math.random() * tracks.length);
        if (next === currentIndex) next = (next + 1) % tracks.length;
        playIndex(next);
        return;
      }
      // Sequential
      if (currentIndex < tracks.length - 1) {
        playIndex(currentIndex + 1);
      } else {
        // At end
        if (repeat === 'all') {
          playIndex(0);
        } else if (repeat === 'one') {
          const audio = audioRef.current;
          if (audio) {
            audio.currentTime = 0;
            audio.play().catch(() => {});
          }
        } else {
          // off
          setIsPlaying(false);
        }
      }
    },
    [tracks.length, currentIndex, shuffle, repeat, playIndex]
  );

  const pickPrev = useCallback(() => {
    if (tracks.length === 0) return;
    const audio = audioRef.current;
    // If more than 3s in, restart current
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    if (shuffle) {
      let prev = Math.floor(Math.random() * tracks.length);
      if (prev === currentIndex) prev = (prev + 1) % tracks.length;
      playIndex(prev);
      return;
    }
    if (currentIndex > 0) {
      playIndex(currentIndex - 1);
    } else {
      playIndex(tracks.length - 1);
    }
  }, [tracks.length, currentIndex, shuffle, playIndex]);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(f.name));
    if (fileArray.length === 0) return;

    const newTracks: Track[] = await Promise.all(
      fileArray.map(async (file) => {
        const url = URL.createObjectURL(file);
        const tags = await readTags(file);
        const albumArtUrl = pictureToDataUrl(tags.picture);
        return {
          id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
          file,
          url,
          title: tags.title || deriveTitle(file),
          artist: tags.artist || 'Artista desconocido',
          albumArtUrl,
        };
      })
    );

    setTracks((prev) => {
      const combined = [...prev, ...newTracks];
      // If nothing was playing, start the first newly added track
      if (currentIndex < 0 && combined.length > 0) {
        setCurrentIndex(prev.length); // index of first new track in combined list
        setIsPlaying(true);
      }
      return combined;
    });
  }, [currentIndex]);

  const clearPlaylist = useCallback(() => {
    tracks.forEach((t) => URL.revokeObjectURL(t.url));
    setTracks([]);
    setCurrentIndex(-1);
    setIsPlaying(false);
    setCurrent(0);
    setDuration(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
    }
  }, [tracks]);

  const cycleRepeat = useCallback(() => {
    setRepeat((r) => (r === 'off' ? 'all' : r === 'all' ? 'one' : 'off'));
  }, []);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      tracks.forEach((t) => URL.revokeObjectURL(t.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-b from-[#0a0a0f] via-[#0d0d14] to-[#0a0a0f] text-white">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-emerald-500/10 to-transparent" />

      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => pickNext(true)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 pt-8 pb-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/15 ring-1 ring-emerald-400/20">
              <Music4 className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight">Reproductor</h1>
              <p className="text-[11px] leading-tight text-zinc-500">MP3 Local</p>
            </div>
          </div>
          <span className="text-xs text-zinc-600">
            {tracks.length} {tracks.length === 1 ? 'pista' : 'pistas'}
          </span>
        </header>

        {/* Album art */}
        <div className="fade-up pt-2">
          <AlbumArt src={currentTrack?.albumArtUrl ?? null} isPlaying={isPlaying} />
        </div>

        {/* Track info */}
        <div className="fade-up text-center">
          <h2 className="truncate-2 text-xl font-bold tracking-tight">
            {currentTrack?.title ?? 'Sin pista seleccionada'}
          </h2>
          <p className="truncate-2 mt-0.5 text-sm text-zinc-400">
            {currentTrack?.artist ?? 'Abre un archivo de música para empezar'}
          </p>
        </div>

        {/* Progress */}
        <ProgressBar current={current} duration={duration} onSeek={(v) => {
          if (audioRef.current) audioRef.current.currentTime = v;
          setCurrent(v);
        }} />

        {/* Controls */}
        <Controls
          isPlaying={isPlaying}
          shuffle={shuffle}
          repeat={repeat}
          onPlayPause={togglePlayPause}
          onPrev={pickPrev}
          onNext={() => pickNext(false)}
          onToggleShuffle={() => setShuffle((s) => !s)}
          onCycleRepeat={cycleRepeat}
        />

        {/* Volume */}
        <VolumeControl
          volume={volume}
          muted={muted}
          onVolumeChange={(v) => {
            setVolume(v);
            if (v > 0) setMuted(false);
          }}
          onToggleMute={() => setMuted((m) => !m)}
        />

        {/* Open files button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 py-3.5 text-sm font-bold text-zinc-900 shadow-lg shadow-emerald-500/20 transition active:scale-[0.98]"
        >
          <FolderOpen className="h-5 w-5" />
          Abrir Archivos de Música
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />

        {/* Playlist */}
        <div className="fade-up">
          <Playlist
            tracks={tracks}
            currentIndex={currentIndex}
            onSelect={playIndex}
            onClear={clearPlaylist}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
