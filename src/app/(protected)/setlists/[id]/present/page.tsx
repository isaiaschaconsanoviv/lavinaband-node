'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/ConfirmModal';
import ModalPortal from '@/components/ui/ModalPortal';
import SlideView from '@/components/live/SlideView';
import { slideIndex, slideLabel, useSetlistSlides } from '@/components/live/useSetlistSlides';
import { useWakeLock } from '@/lib/useWakeLock';

type LiveBody = { songId: string; section: number; blank: boolean };

// Modo presentador: elige qué parte de qué canción ve toda la banda en la vista en vivo
export default function PresentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { setlist, songs, flat, error } = useSetlistSlides(id);
  const [index, setIndex] = useState(-1);
  const [blank, setBlank] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  useWakeLock();

  // Envía la posición en orden: si se presiona varias veces seguidas, solo se manda la última
  // al terminar la anterior (así una respuesta lenta no regresa a un slide viejo)
  const pending = useRef<LiveBody | null>(null);
  const sending = useRef(false);
  const send = useCallback(async (body: LiveBody) => {
    pending.current = body;
    if (sending.current) return;
    sending.current = true;
    while (pending.current) {
      const next = pending.current;
      pending.current = null;
      try {
        const res = await fetch(`/api/setlists/${id}/live`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(next),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          toast.error(data.error || 'No se pudo actualizar la vista en vivo');
        }
      } catch {
        toast.error('Sin conexión: la banda no recibió el cambio');
      }
    }
    sending.current = false;
  }, [id]);

  const show = useCallback((i: number, isBlank = false) => {
    const slide = flat[i];
    if (!slide) return;
    setIndex(i);
    setBlank(isBlank);
    send({ songId: slide.songId, section: slide.section, blank: isBlank });
  }, [flat, send]);

  // Al abrir: si ya hay una presentación en curso se continúa donde va; si no, empieza en el primer slide
  const started = useRef(false);
  useEffect(() => {
    if (started.current || flat.length === 0) return;
    started.current = true;
    fetch(`/api/setlists/${id}/live`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        const current = d.success && d.data.isActive ? slideIndex(flat, d.data.songId, d.data.section) : -1;
        show(current >= 0 ? current : 0, current >= 0 && d.data.blank);
      })
      .catch(() => show(0));
  }, [flat, id, show]);

  const next = () => {
    if (index < flat.length - 1) show(index + 1);
    else if (blank) show(index);
  };
  const prev = () => {
    if (index > 0) show(index - 1);
    else if (blank) show(index);
  };
  const toggleBlank = () => show(index, !blank);

  // Teclado (o control de presentaciones): → ↓ espacio avanzan, ← ↑ regresan, B pantalla en blanco
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (index < 0 || showEndModal) return;
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) {
        e.preventDefault();
        next();
      } else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) {
        e.preventDefault();
        prev();
      } else if (e.key === 'b' || e.key === 'B') {
        toggleBlank();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Mantiene visible en la lista la parte actual
  useEffect(() => {
    listRef.current?.querySelector('[data-current="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [index]);

  const endPresentation = async () => {
    setShowEndModal(false);
    await fetch(`/api/setlists/${id}/live`, { method: 'DELETE' }).catch(() => {});
    router.push(`/setlists/${id}`);
  };

  if (error) return <div className="p-8 text-center text-red-400">No se encontró el set list. Detalle: {error}</div>;
  if (!setlist) return <div className="p-8 text-center text-zinc-400">Cargando...</div>;
  if (flat.length === 0) return <div className="p-8 text-center text-zinc-400">Este set list no tiene canciones.</div>;

  const slide = flat[index];
  const song = slide ? songs.find(s => s.songId === slide.songId) : undefined;
  const upcoming = flat[index + 1];

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 bg-zinc-950 text-zinc-100 flex flex-col">
        <header className="px-3 sm:px-4 py-2 border-b border-zinc-800 flex items-center gap-2 shrink-0 bg-zinc-900">
          <Link href={`/setlists/${id}`} className="text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-700 p-2 rounded-full shrink-0" title="Volver al set list (la presentación sigue)">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Presentando
            </p>
            <h1 className="truncate text-base font-semibold">{setlist.title}</h1>
          </div>
          <button onClick={() => setShowEndModal(true)} className="shrink-0 px-3 py-1.5 bg-red-900/40 hover:bg-red-600/80 text-red-400 hover:text-white border border-red-900/50 hover:border-red-600 rounded-lg text-sm font-medium transition-colors">
            Terminar
          </button>
        </header>

        <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
          <section className="flex-1 min-h-0 flex flex-col p-3 sm:p-4 gap-3">
            <p className="text-sm text-zinc-400 truncate shrink-0">
              {slide ? <><span className="text-zinc-200 font-medium">{slide.songTitle}</span> · Parte {slide.section + 1} de {song?.slides.length}</> : ' '}
            </p>

            <div className={`flex-1 min-h-0 overflow-auto rounded-xl border p-4 sm:p-6 bg-black ${blank ? 'border-amber-500/40' : 'border-zinc-800'}`}>
              {blank ? (
                <div className="h-full flex items-center justify-center text-amber-400/80 text-sm font-medium">Pantalla en blanco — la banda no ve letra</div>
              ) : slide && (
                <SlideView slide={slide} offset={song?.offset ?? 0} fontSize={20} />
              )}
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 shrink-0">
              <button onClick={prev} disabled={index <= 0 && !blank} className="py-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 font-semibold disabled:opacity-40 transition-colors">
                ← Anterior
              </button>
              <button
                onClick={toggleBlank}
                className={`px-4 rounded-xl border text-sm font-semibold transition-colors ${blank ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'}`}
                title="Pantalla en blanco (B)"
              >
                {blank ? 'Mostrar' : 'En blanco'}
              </button>
              <button onClick={next} disabled={index >= flat.length - 1 && !blank} className="py-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white disabled:opacity-40 transition-colors">
                Siguiente →
              </button>
            </div>

            <p className="text-xs text-zinc-500 truncate shrink-0">
              {upcoming
                ? <>Sigue: {upcoming.songId !== slide?.songId && <span className="text-zinc-300">🎵 {upcoming.songTitle} · </span>}{slideLabel(upcoming)}</>
                : 'Es la última parte del set list'}
            </p>
          </section>

          <aside ref={listRef} className="lg:w-96 shrink-0 max-h-[38vh] lg:max-h-none overflow-y-auto custom-scrollbar border-t lg:border-t-0 lg:border-l border-zinc-800 p-3 sm:p-4 space-y-4">
            {songs.map((s, songPos) => (
              <div key={s.songId}>
                <h2 className={`text-sm font-semibold mb-2 ${s.songId === slide?.songId ? 'text-white' : 'text-zinc-400'}`}>
                  {songPos + 1}. {s.title}
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {s.slides.map(sl => {
                    const i = flat.indexOf(sl);
                    const isCurrent = i === index;
                    return (
                      <button
                        key={sl.section}
                        data-current={isCurrent}
                        onClick={() => show(i)}
                        className={`max-w-full truncate text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${isCurrent ? (blank ? 'bg-amber-500/20 border-amber-500/50 text-amber-200' : 'bg-blue-600 border-blue-500 text-white') : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500'}`}
                      >
                        {slideLabel(sl)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </aside>
        </div>
      </div>

      <ConfirmModal
        isOpen={showEndModal}
        title="Terminar presentación"
        message="La vista en vivo de la banda dejará de mostrar la letra."
        confirmText="Sí, terminar"
        cancelText="Seguir presentando"
        onConfirm={endPresentation}
        onCancel={() => setShowEndModal(false)}
        isDanger={true}
      />
    </ModalPortal>
  );
}
