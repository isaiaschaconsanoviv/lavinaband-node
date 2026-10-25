'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { songSlides, type Slide, type SongContent } from '@/lib/songSlides';

// Lo que usan el presentador y la vista en vivo de GET /api/setlists/[id]
interface SetlistData {
  title: string;
  songs?: { song: (SongContent & { _id: string; title: string }) | null; order?: number }[];
}

export interface SongSlides {
  songId: string;
  title: string;
  // Semitonos para ver los acordes en el tono guardado de la canción
  offset: number;
  slides: Slide[];
}

// Carga el set list y lo divide en slides (en el orden del set list)
export function useSetlistSlides(id: string) {
  const [setlist, setSetlist] = useState<SetlistData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    return fetch(`/api/setlists/${id}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        if (d.success) setSetlist(d.data);
        else setError(d.error || 'No se encontró el set list');
      })
      .catch(e => setError(e.message || 'Error de red'));
  }, [id]);

  useEffect(() => {
    reload();
  }, [reload]);

  const songs = useMemo<SongSlides[]>(() => {
    if (!setlist) return [];
    return [...(setlist.songs || [])]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .flatMap(({ song }) => {
        if (!song) return [];
        const { slides, offset } = songSlides(song);
        return [{ songId: String(song._id), title: song.title, offset, slides }];
      });
  }, [setlist]);

  const flat = useMemo(() => songs.flatMap(s => s.slides), [songs]);

  return { setlist, songs, flat, error, reload };
}

// Nombre corto de un slide: su encabezado ("Coro"), o el inicio de la letra
export function slideLabel(slide: Slide) {
  if (slide.header) return slide.header;
  const first = slide.lines.find(l => l.lyric.trim())?.lyric.trim();
  if (!first) return `Parte ${slide.section + 1}`;
  return first.length > 28 ? `${first.slice(0, 28)}…` : first;
}

export function slideIndex(flat: Slide[], songId: string | null, section: number) {
  if (!songId) return -1;
  const exact = flat.findIndex(s => s.songId === songId && s.section === section);
  // Si la canción cambió y ya no tiene esa sección, se queda en su primera parte
  return exact >= 0 ? exact : flat.findIndex(s => s.songId === songId);
}
