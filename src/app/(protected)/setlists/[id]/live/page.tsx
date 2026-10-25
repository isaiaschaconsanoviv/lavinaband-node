'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ModalPortal from '@/components/ui/ModalPortal';
import SlideView from '@/components/live/SlideView';
import { slideIndex, slideLabel, useSetlistSlides } from '@/components/live/useSetlistSlides';
import { useLocalPref } from '@/lib/useLocalPref';
import { useWakeLock } from '@/lib/useWakeLock';

// Cada cuánto se pregunta en qué parte va el presentador: seguido mientras presenta y más
// espaciado mientras no hay presentación. Con la pantalla bloqueada o en otra app no se pregunta.
const POLL_ACTIVE_MS = 1000;
const POLL_IDLE_MS = 5000;

const FONT_SIZES = ['18', '22', '26', '30', '36', '42', '48'] as const;

interface LiveState {
  isActive: boolean;
  songId: string | null;
  section: number;
  blank: boolean;
  presenterName: string | null;
}

// Vista en vivo: muestra la parte de la canción que eligió el presentador
export default function LivePage() {
  const { id } = useParams<{ id: string }>();
  const { setlist, songs, flat, error, reload } = useSetlistSlides(id);
  const [live, setLive] = useState<LiveState | null>(null);
  const [online, setOnline] = useState(true);
  const [fontSize, setFontSize] = useLocalPref('liveFontSize', '30', FONT_SIZES);
  const [chords, setChords] = useLocalPref('liveShowChords', 'on', ['on', 'off']);
  const showChords = chords === 'on';
  useWakeLock();

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = async () => {
      if (cancelled || inFlight || document.visibilityState !== 'visible') return;
      inFlight = true;
      let active = false;
      try {
        const res = await fetch(`/api/setlists/${id}/live`, { cache: 'no-store' });
        const d = await res.json();
        if (!d.success) throw new Error(d.error);
        active = d.data.isActive;
        if (!cancelled) {
          setLive(d.data);
          setOnline(true);
        }
      } catch {
        if (!cancelled) setOnline(false);
      } finally {
        inFlight = false;
      }
      if (!cancelled) {
        clearTimeout(timer);
        timer = setTimeout(tick, active ? POLL_ACTIVE_MS : POLL_IDLE_MS);
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        clearTimeout(timer);
        tick();
      }
    };

    tick();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [id]);

  const index = live?.isActive ? slideIndex(flat, live.songId, live.section) : -1;

  // Si el presentador está en una canción que no tenemos (agregaron canciones al set list
  // después de abrir esta vista), se vuelve a cargar el set list una vez
  const reloadedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!setlist || !live?.songId || index >= 0 || reloadedFor.current === live.songId) return;
    reloadedFor.current = live.songId;
    reload();
  }, [setlist, live?.songId, index, reload]);

  const fontPos = FONT_SIZES.indexOf(fontSize);
  const changeFont = (delta: number) => {
    const nextPos = Math.min(Math.max(fontPos + delta, 0), FONT_SIZES.length - 1);
    setFontSize(FONT_SIZES[nextPos]);
  };

  // Pantalla completa real del navegador (no existe en iPhone)
  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen?.().catch(() => {});
  };

  if (error) return <div className="p-8 text-center text-red-400">No se encontró el set list. Detalle: {error}</div>;
  if (!setlist) return <div className="p-8 text-center text-zinc-400">Cargando...</div>;

  const slide = index >= 0 ? flat[index] : undefined;
  const song = slide ? songs.find(s => s.songId === slide.songId) : undefined;
  const upcoming = index >= 0 ? flat[index + 1] : undefined;

  let message: string | null = null;
  if (!live) message = 'Conectando…';
  else if (!live.isActive) message = 'Esperando al presentador…';
  else if (!slide) message = 'Actualizando el set list…';

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 bg-black text-zinc-100 flex flex-col">
        <header className="px-3 sm:px-4 py-2 border-b border-zinc-900 flex items-center gap-2 shrink-0 bg-zinc-950">
          <span
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${!online ? 'bg-amber-500 animate-pulse' : live?.isActive ? 'bg-green-500' : 'bg-zinc-600'}`}
            title={!online ? 'Reconectando…' : live?.isActive ? 'En vivo' : 'Sin presentación'}
          />
          <div className="flex-1 min-w-0">
            <h1 className="truncate text-sm sm:text-base font-semibold">{slide ? slide.songTitle : setlist.title}</h1>
            {live?.presenterName && <p className="truncate text-[11px] text-zinc-500">Presenta: {live.presenterName}</p>}
          </div>
          <button
            onClick={() => setChords(showChords ? 'off' : 'on')}
            className={`shrink-0 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${showChords ? 'bg-purple-500/15 border-purple-500/40 text-purple-300' : 'border-zinc-700 text-zinc-500 hover:text-zinc-300'}`}
            title={showChords ? 'Ocultar acordes' : 'Mostrar acordes'}
          >
            Acordes
          </button>
          <div className="flex items-center rounded-lg border border-zinc-700 overflow-hidden shrink-0">
            <button onClick={() => changeFont(-1)} disabled={fontPos === 0} className="px-2.5 py-1.5 text-sm font-semibold text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 transition-colors" title="Letra más pequeña">A−</button>
            <button onClick={() => changeFont(1)} disabled={fontPos === FONT_SIZES.length - 1} className="px-2.5 py-1.5 text-base font-semibold text-zinc-300 hover:bg-zinc-800 border-l border-zinc-700 disabled:opacity-40 transition-colors" title="Letra más grande">A+</button>
          </div>
          <button onClick={toggleFullscreen} className="hidden sm:block text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-700 p-2 rounded-full shrink-0" title="Pantalla completa">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
          </button>
          <Link href={`/setlists/${id}`} className="text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-700 p-2 rounded-full shrink-0" title="Salir de la vista en vivo">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </Link>
        </header>

        {!online && (
          <div className="px-4 py-1.5 bg-amber-500/15 text-amber-300 text-xs text-center shrink-0">Reconectando… puede que no sea la parte actual</div>
        )}

        <main className="flex-1 min-h-0 overflow-auto overscroll-contain px-4 py-6 sm:px-10 sm:py-8">
          {message ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-2 text-zinc-500">
              <p className="text-lg">{message}</p>
              {live && !live.isActive && <p className="text-sm text-zinc-600">La letra aparecerá aquí cuando inicie la presentación.</p>}
            </div>
          ) : live?.blank ? null : slide && (
            <SlideView slide={slide} offset={song?.offset ?? 0} showChords={showChords} fontSize={Number(fontSize)} />
          )}
        </main>

        {slide && (
          <footer className="px-4 py-2 border-t border-zinc-900 text-xs sm:text-sm text-zinc-500 truncate shrink-0">
            {upcoming
              ? <>Sigue: {upcoming.songId !== slide.songId && <span className="text-zinc-300">🎵 {upcoming.songTitle} · </span>}{slideLabel(upcoming)}</>
              : 'Última parte del set list'}
          </footer>
        )}
      </div>
    </ModalPortal>
  );
}
