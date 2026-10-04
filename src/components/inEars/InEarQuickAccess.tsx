'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import InEarsClient from '@/app/(protected)/in-ears/InEarsClient';
import type { InEarChannel } from '@/lib/inEars';

interface MyMix {
  actorId: string;
  name: string;
  channels: InEarChannel[];
  mix: { levels: Record<string, number>; order: string[] };
}

async function fetchMyMix(): Promise<MyMix | null> {
  const res = await fetch('/api/in-ears/me', { cache: 'no-store' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

// Burbuja flotante con acceso rápido a la mezcla propia de In-Ears. Abre un panel
// encima de todo (incluido el modal de canción) sin salir de la página, así que al
// cerrarlo se sigue exactamente donde se estaba. Solo aparece a quien canta o toca.
export default function InEarQuickAccess() {
  const [hasMix, setHasMix] = useState(false);
  const [myMix, setMyMix] = useState<MyMix | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchMyMix().then(mix => setHasMix(!!mix)).catch(() => {});
  }, []);

  // Cerrar con Esc
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  // Siempre se cargan los niveles actuales al abrir (el ingeniero pudo moverlos)
  const open = async () => {
    setIsLoading(true);
    try {
      const mix = await fetchMyMix();
      if (!mix) return;
      setMyMix(mix);
      setIsOpen(true);
    } catch {
      toast.error('No se pudo cargar tu mezcla');
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasMix) return null;

  return (
    <>
      {!isOpen && (
        <button
          onClick={open}
          disabled={isLoading}
          className="fixed z-[60] right-4 bottom-24 md:bottom-6 md:right-6 w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-2xl shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-white/10 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-70"
          title="In-Ears: mi mezcla"
          aria-label="Abrir mi mezcla de In-Ears"
        >
          {isLoading ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : '🎧'}
        </button>
      )}

      {isOpen && myMix && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsOpen(false)}>
          <div
            className="w-full max-w-6xl max-h-[88dvh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom-8 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-zinc-800 shrink-0">
              <h2 className="text-lg font-semibold text-zinc-100">🎧 In-Ears</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors bg-zinc-800/50 hover:bg-zinc-700 p-2 rounded-full"
                title="Cerrar"
                aria-label="Cerrar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar p-4 sm:p-6">
              {/* Misma vista que la sección In-Ears, solo con la mezcla propia. Al cerrar el
                  panel se desmonta y envía de inmediato los cambios pendientes. */}
              <InEarsClient
                actorId={myMix.actorId}
                canManage={false}
                isSoundEngineer={false}
                channels={myMix.channels}
                performers={[{ _id: myMix.actorId, name: myMix.name }]}
                initialOwnerId={myMix.actorId}
                initialMix={myMix.mix}
                allowReorder={false}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
