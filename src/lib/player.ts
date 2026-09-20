export interface Track {
  id: string;
  file: File;
  url: string;
  title: string;
  artist: string;
  albumArtUrl: string | null;
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface ID3Tags {
  title?: string;
  artist?: string;
  picture?: {
    format: string;
    data: number[];
  };
}

declare global {
  interface Window {
    jsmediatags: {
      read: (
        source: File,
        handlers: {
          onSuccess: (tag: { tags: ID3Tags }) => void;
          onError: (error: unknown) => void;
        }
      ) => void;
    };
  }
}

export function readTags(file: File): Promise<ID3Tags> {
  return new Promise((resolve) => {
    if (!window.jsmediatags) {
      resolve({});
      return;
    }
    try {
      window.jsmediatags.read(file, {
        onSuccess: (tag) => resolve(tag.tags || {}),
        onError: () => resolve({}),
      });
    } catch {
      resolve({});
    }
  });
}

function arrayBufferToBase64(data: number[]): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

export function pictureToDataUrl(picture: ID3Tags['picture']): string | null {
  if (!picture || !picture.data || !picture.format) return null;
  try {
    return `data:${picture.format};base64,${arrayBufferToBase64(picture.data)}`;
  } catch {
    return null;
  }
}

export function deriveTitle(file: File): string {
  const name = file.name.replace(/\.[^/.]+$/, '');
  return name || 'Unknown Track';
}

export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
