import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react';
import { FolderOpen, Music4, Upload } from 'lucide-react';
import AlbumArt from '@/components/AlbumArt';
import ProgressBar from '@/components/ProgressBar';
import VolumeControl from '@/components/VolumeControl';
import Controls from '@/components/Controls';
import Playlist from '@/components/Playlist';
import {
  clearSavedPlaylist,
  deriveTitle,
  loadPlaylist,
  pictureToDataUrl,
  readTags,
  savePlaylist,
  type RepeatMode,
  type SortKey,
  type Track,
} from '@/lib/player';

const SPEEDS = [0.5, 1, 1.25, 1.5, 2];

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
  const [speed, setSpeed] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [dragging, setDragging] = useState(false);
  const [ready, setReady] = useState(false);
  const [restored, setRestored] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  const currentTrack = currentIndex >= 0 ? tracks[currentIndex] : null;

  // Restore playlist metadata. Local File objects intentionally cannot be persisted.
  useEffect(() => {
    const saved = loadPlaylist();
    if (saved.length) {
      setTracks(saved.map((t) => ({
        id: t.id,
        file: null,
        url: '',
        title: t.title,
        artist: t.artist,
        albumArtUrl: t.albumArtUrl,
        duration: t.duration || 0,
        size: t.size || 0,
        lastModified: t.lastModified || 0,
        available: false,
      })));
      setRestored(true);
      setCurrentIndex(0);
    }
    const timer = window.setTimeout(() => setReady(true), 450);
    return () => window.clearTimeout(timer);
  }, []);

  // Save playlist metadata whenever it changes.
  useEffect(() => {
    if (tracks.length) savePlaylist(tracks);
  }, [tracks]);

  // Load track into audio element when index changes.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack?.available || !currentTrack.url) return;
    audio.src = currentTrack.url;
    audio.load();
    audio.playbackRate = speed;
    setCurrent(0);
    setDuration(currentTrack.duration || 0);
    if (isPlaying) audio.play().catch(() => setIsPlaying(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, currentTrack?.url]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = muted;
      audioRef.current.playbackRate = speed;
    }
  }, [volume, muted, speed]);

  // Media Session: Android lock screen / notification controls and metadata.
  useEffect(() => {
    const mediaSession = navigator.mediaSession;
    if (!mediaSession || !currentTrack) return;

    mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      album: 'Oidas Music',
      artwork: currentTrack.albumArtUrl
        ? [{ src: currentTrack.albumArtUrl, sizes: '512x512' }]
        : [],
    });

    const handlers: Array<[MediaSessionAction, MediaSessionActionHandler]> = [
      ['play', () => audioRef.current?.play().catch(() => {})],
      ['pause', () => audioRef.current?.pause()],
      ['previoustrack', () => pickPrevRef.current()],
      ['nexttrack', () => pickNextRef.current(false)],
    ];

    handlers.forEach(([action, handler]) => {
      try { mediaSession.setActionHandler(action, handler); } catch { /* unsupported action */ }
    });

    return () => {
      handlers.forEach(([action]) => {
        try { mediaSession.setActionHandler(action, null); } catch { /* ignore */ }
      });
    };
  }, [currentTrack]);

  useEffect(() => {
    if (navigator.mediaSession) navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  const playIndex = useCallback((index: number) => {
    if (!tracks[index]?.available) return;
    setCurrentIndex(index);
    setIsPlaying(true);
  }, [tracks]);

  const pickPrev = useCallback(() => {
    if (tracks.length === 0) return;
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    if (shuffle) {
      let prev = Math.floor(Math.random() * tracks.length);
      if (prev === currentIndex) prev = (prev + 1) % tracks.length;
      if (tracks[prev]?.available) playIndex(prev);
      return;
    }
    for (let offset = 1; offset <= tracks.length; offset++) {
      const index = (currentIndex - offset + tracks.length) % tracks.length;
      if (tracks[index]?.available) { playIndex(index); return; }
    }
  }, [tracks, currentIndex, shuffle, playIndex]);

  const pickNext = useCallback((auto: boolean) => {
    if (!tracks.length) return;
    if (auto && repeat === 'one') {
      const audio = audioRef.current;
      if (audio) { audio.currentTime = 0; audio.play().catch(() => {}); }
      return;
    }
    if (shuffle) {
      const available = tracks.map((t, i) => t.available ? i : -1).filter(i => i >= 0);
      if (available.length === 1 && repeat === 'off' && auto) { setIsPlaying(false); return; }
      if (available.length) {
        let next = available[Math.floor(Math.random() * available.length)];
        if (available.length > 1 && next === currentIndex) next = available[(available.indexOf(next) + 1) % available.length];
        playIndex(next);
      }
      return;
    }
    for (let offset = 1; offset <= tracks.length; offset++) {
      const index = currentIndex + offset;
      if (index < tracks.length && tracks[index].available) { playIndex(index); return; }
      if (index >= tracks.length) break;
    }
    if (repeat === 'all') {
      const first = tracks.findIndex(t => t.available);
      if (first >= 0) playIndex(first);
    } else {
      setIsPlaying(false);
    }
  }, [tracks, currentIndex, shuffle, repeat, playIndex]);

  const pickNextRef = useRef(pickNext);
  const pickPrevRef = useRef(pickPrev);
  useEffect(() => { pickNextRef.current = pickNext; }, [pickNext]);
  useEffect(() => { pickPrevRef.current = pickPrev; }, [pickPrev]);

  const togglePlayPause = useCallback(() => {
    if (!currentTrack?.available) {
      fileInputRef.current?.click();
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.pause();
    else audio.play().catch(() => setIsPlaying(false));
  }, [isPlaying, currentTrack]);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) =>
      f.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(f.name)
    );
    if (!fileArray.length) return;

    const saved = loadPlaylist();
    const newTracks: Track[] = await Promise.all(fileArray.map(async (file) => {
      const savedMatch = saved.find(t =>
        t.name === file.name && (t.size === file.size || !t.size) &&
        (t.lastModified === file.lastModified || !t.lastModified)
      );
      const tags = await readTags(file);
      return {
        id: savedMatch?.id ?? `${file.name}-${file.size}-${file.lastModified}`,
        file,
        url: URL.createObjectURL(file),
        title: tags.title || savedMatch?.title || deriveTitle(file),
        artist: tags.artist || savedMatch?.artist || 'Artista desconocido',
        albumArtUrl: pictureToDataUrl(tags.picture) || savedMatch?.albumArtUrl || null,
        duration: savedMatch?.duration || 0,
        size: file.size,
        lastModified: file.lastModified,
        available: true,
      };
    }));

    setTracks(prev => {
      // When restoring, replace matching placeholders and preserve saved order.
      if (prev.some(t => !t.available)) {
        const byName = new Map(newTracks.map(t => [t.file?.name, t]));
        const merged = prev.map(old => byName.get(old.file?.name) ?? old);
        const extras = newTracks.filter(t => !prev.some(old => old.file?.name === t.file?.name));
        const result = [...merged, ...extras];
        const firstAvailable = result.findIndex(t => t.available);
        if (currentIndex < 0 && firstAvailable >= 0) {
          setCurrentIndex(firstAvailable);
          setIsPlaying(true);
        }
        return result;
      }
      const combined = [...prev, ...newTracks];
      if (currentIndex < 0 && combined.length) {
        setCurrentIndex(prev.length);
        setIsPlaying(true);
      }
      return combined;
    });
    setRestored(false);
  }, [currentIndex]);

  const clearPlaylist = useCallback(() => {
    tracks.forEach(t => { if (t.url) URL.revokeObjectURL(t.url); });
    clearSavedPlaylist();
    setTracks([]);
    setCurrentIndex(-1);
    setIsPlaying(false);
    setCurrent(0);
    setDuration(0);
    setRestored(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
    }
  }, [tracks]);

  const sortTracks = useCallback((key: SortKey) => {
    setSortKey(key);
    setTracks(prev => {
      const currentId = prev[currentIndex]?.id;
      const sorted = [...prev].sort((a, b) => {
        if (key === 'artist') return a.artist.localeCompare(b.artist, undefined, { sensitivity: 'base' });
        if (key === 'duration') return (a.duration || 0) - (b.duration || 0);
        return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
      });
      const newIndex = currentId ? sorted.findIndex(t => t.id === currentId) : -1;
      setCurrentIndex(newIndex);
      return sorted;
    });
  }, [currentIndex]);

  // Keep persisted duration metadata current.
  const updateCurrentDuration = useCallback((value: number) => {
    setDuration(value);
    if (currentIndex >= 0) {
      setTracks(prev => prev.map((t, i) => i === currentIndex ? { ...t, duration: value } : t));
    }
  }, [currentIndex]);

  const onDragEnter = (e: DragEvent) => {
    e.preventDefault();
    dragDepth.current += 1;
    if (Array.from(e.dataTransfer.items).some(i => i.kind === 'file')) setDragging(true);
  };
  const onDragLeave = (e: DragEvent) => {
    e.preventDefault();
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) { dragDepth.current = 0; setDragging(false); }
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/15 ring-1 ring-emerald-400/20">
            <Music4 className="h-7 w-7 text-emerald-400" />
          </div>
          <span className="text-xs font-medium text-zinc-500">Oidas Music</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative flex min-h-screen flex-col bg-gradient-to-b from-[#0a0a0f] via-[#0d0d14] to-[#0a0a0f] text-white"
      onDragEnter={onDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-emerald-500/10 to-transparent" />

      {dragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0f]/90 p-6">
          <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-3xl border border-dashed border-emerald-400/50 bg-emerald-400/10 px-8 py-12 text-center">
            <Upload className="h-10 w-10 text-emerald-400" />
            <p className="text-lg font-bold">Suelta tu música aquí</p>
            <p className="text-xs text-zinc-500">MP3 y otros formatos de audio compatibles</p>
          </div>
        </div>
      )}

      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => updateCurrentDuration(e.currentTarget.duration)}
        onDurationChange={(e) => {
          if (e.currentTarget.duration && isFinite(e.currentTarget.duration)) updateCurrentDuration(e.currentTarget.duration);
        }}
        onEnded={() => pickNext(true)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 pt-8 pb-6">
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
          <span className="text-xs text-zinc-600">{tracks.length} {tracks.length === 1 ? 'pista' : 'pistas'}</span>
        </header>

        <div className="fade-up pt-2">
          <AlbumArt src={currentTrack?.albumArtUrl ?? null} isPlaying={isPlaying} />
        </div>

        <div className="fade-up text-center">
          <h2 className="truncate-2 text-xl font-bold tracking-tight">{currentTrack?.title ?? 'Sin pista seleccionada'}</h2>
          <p className="truncate-2 mt-0.5 text-sm text-zinc-400">
            {currentTrack?.artist ?? 'Abre un archivo de música para empezar'}
          </p>
        </div>

        <ProgressBar
          current={current}
          duration={duration}
          onSeek={(v) => {
            if (audioRef.current) audioRef.current.currentTime = v;
            setCurrent(v);
          }}
        />

        <Controls
          isPlaying={isPlaying}
          shuffle={shuffle}
          repeat={repeat}
          onPlayPause={togglePlayPause}
          onPrev={pickPrev}
          onNext={() => pickNext(false)}
          onToggleShuffle={() => setShuffle(s => !s)}
          onCycleRepeat={() => setRepeat(r => r === 'off' ? 'all' : r === 'all' ? 'one' : 'off')}
        />

        <div className="flex items-center justify-center gap-2">
          <span className="text-xs text-zinc-500">Velocidad</span>
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-200 outline-none ring-1 ring-white/10"
            aria-label="Velocidad de reproducción"
          >
            {SPEEDS.map(value => <option key={value} value={value}>{value}x</option>)}
          </select>
        </div>

        <VolumeControl
          volume={volume}
          muted={muted}
          onVolumeChange={(v) => { setVolume(v); if (v > 0) setMuted(false); }}
          onToggleMute={() => setMuted(m => !m)}
        />

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

        <div className="fade-up">
          <Playlist
            tracks={tracks}
            currentIndex={currentIndex}
            onSelect={playIndex}
            onClear={clearPlaylist}
            onSort={sortTracks}
            sortKey={sortKey}
            unavailableNotice={restored}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
