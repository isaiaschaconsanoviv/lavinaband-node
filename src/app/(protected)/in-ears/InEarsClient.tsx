'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, TouchSensor, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import CustomSelect from '@/components/ui/CustomSelect';
import InEarFader from '@/components/inEars/InEarFader';
import InEarChangesPanel from './InEarChangesPanel';
import { MASTER_CHANNEL, sortChannels, type InEarChannel } from '@/lib/inEars';

// Tiempo sin mover los faders antes de enviar los cambios al ingeniero
const SEND_DELAY_MS = 3000;

type Status = 'idle' | 'pending' | 'sending' | 'sent' | 'error';

interface Mix {
  levels: Record<string, number>;
  order: string[];
}

interface InEarsClientProps {
  actorId: string;
  canManage: boolean;
  // Los ingenieros de audio solo ven el panel de cambios recientes (sin faders)
  isSoundEngineer: boolean;
  channels: InEarChannel[];
  performers: { _id: string; name: string }[];
  initialOwnerId: string | null;
  initialMix: Mix;
}

function SortableFader({ id, isReordering, children }: { id: string; isReordering: boolean; children: (handle: React.ReactNode) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : undefined, position: 'relative' as const };

  const handle = isReordering ? (
    <div {...attributes} {...listeners} style={{ touchAction: 'none' }} className="cursor-grab text-zinc-400 hover:text-white px-2 py-1 bg-zinc-800 rounded-md active:bg-zinc-700 transition-colors shadow-sm select-none">
      ☰
    </div>
  ) : null;

  return <div ref={setNodeRef} style={style}>{children(handle)}</div>;
}

export default function InEarsClient({ actorId, canManage, isSoundEngineer, channels, performers, initialOwnerId, initialMix }: InEarsClientProps) {
  const [ownerId, setOwnerId] = useState(initialOwnerId);
  const [levels, setLevels] = useState<Record<string, number>>(initialMix.levels);
  const [order, setOrder] = useState<string[]>(initialMix.order);
  const [status, setStatus] = useState<Status>('idle');
  const [isReordering, setIsReordering] = useState(false);
  const [isLoadingMix, setIsLoadingMix] = useState(false);
  const mixTopRef = useRef<HTMLDivElement>(null);
  // Panel colapsable de mezclas (solo para el ingeniero que no canta ni toca)
  const [isMixPanelOpen, setIsMixPanelOpen] = useState(false);

  // Cambios aún no enviados y temporizador del envío
  const pendingRef = useRef<Record<string, number>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ownerRef = useRef(ownerId);
  useEffect(() => {
    ownerRef.current = ownerId;
  }, [ownerId]);

  const sortedChannels = useMemo(() => sortChannels(channels, order), [channels, order]);
  const isOwnMix = ownerId === actorId;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 0, tolerance: 5 } })
  );

  const commit = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    const pending = pendingRef.current;
    const owner = ownerRef.current;
    if (!owner || Object.keys(pending).length === 0) return;

    pendingRef.current = {};
    setStatus('sending');
    try {
      const res = await fetch(`/api/in-ears/${owner}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ levels: pending })
      });
      if (!res.ok) throw new Error();
      setStatus('sent');
    } catch {
      // Conservar los cambios para reintentarlos en el siguiente envío
      pendingRef.current = { ...pending, ...pendingRef.current };
      setStatus('error');
    }
  }, []);

  // Si se cierra o se oculta la página antes de los 3 segundos, enviar lo pendiente
  const flushWithBeacon = useCallback(() => {
    const pending = pendingRef.current;
    const owner = ownerRef.current;
    if (!owner || Object.keys(pending).length === 0) return;
    pendingRef.current = {};
    if (timerRef.current) clearTimeout(timerRef.current);
    navigator.sendBeacon(`/api/in-ears/${owner}`, new Blob([JSON.stringify({ levels: pending })], { type: 'application/json' }));
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushWithBeacon();
    };
    window.addEventListener('pagehide', flushWithBeacon);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', flushWithBeacon);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      flushWithBeacon();
    };
  }, [flushWithBeacon]);

  const setLevel = (channel: string, value: number) => {
    setLevels(prev => ({ ...prev, [channel]: value }));
    pendingRef.current = { ...pendingRef.current, [channel]: value };
    setStatus('pending');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(commit, SEND_DELAY_MS);
  };

  // Carga la mezcla de `newOwnerId` desde el servidor (también sirve para recargar la actual)
  const loadOwnerMix = async (newOwnerId: string) => {
    await commit();
    setIsLoadingMix(true);
    setIsReordering(false);
    try {
      const res = await fetch(`/api/in-ears/${newOwnerId}`);
      const data = await res.json();
      if (!data.success) throw new Error();
      setOwnerId(newOwnerId);
      setLevels(data.data.levels);
      setOrder(data.data.order);
      setStatus('idle');
    } catch {
      toast.error('No se pudo cargar la mezcla');
    } finally {
      setIsLoadingMix(false);
    }
  };

  // Desde "Cambios recientes": abrir la mezcla de quien pidió el cambio y llevar la vista a los faders
  const selectMixFromChange = (mixOwnerId: string) => {
    setIsMixPanelOpen(true);
    loadOwnerMix(mixOwnerId);
    setTimeout(() => mixTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const changeOwner = (newOwnerId: string) => {
    if (newOwnerId !== ownerId) loadOwnerMix(newOwnerId);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !ownerId) return;

    const ids = sortedChannels.map(c => c.id);
    const newOrder = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    setOrder(newOrder);
    try {
      const res = await fetch(`/api/in-ears/${ownerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder })
      });
      if (!res.ok) throw new Error();
    } catch {
      toast.error('No se pudo guardar el orden');
    }
  };

  const statusLabel: Record<Status, string> = {
    idle: '',
    pending: 'Cambios sin enviar…',
    sending: 'Enviando…',
    sent: isOwnMix ? '✓ Enviado al ingeniero' : '✓ Guardado',
    error: 'No se pudo enviar. Se reintentará al mover un fader.',
  };
  const statusColor: Record<Status, string> = {
    idle: '',
    pending: 'text-amber-400',
    sending: 'text-sky-400',
    sent: 'text-emerald-400',
    error: 'text-red-400',
  };

  // El ingeniero que no canta ni toca ve primero los cambios recientes y las mezclas
  // en un panel colapsable; si también es voz o instrumento, ve la vista completa
  const isActorPerformer = performers.some(p => p._id === actorId);
  const isEngineerOnly = isSoundEngineer && !isActorPerformer;

  const mixControls = ownerId && (
    <>
      <div ref={mixTopRef} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 scroll-mt-24">
        {canManage ? (
          <div className="w-full sm:w-72">
            <CustomSelect
              name="mixOwner"
              className="min-w-0"
              value={ownerId}
              options={performers.map(p => ({ value: p._id, label: `Mezcla de ${p.name}${p._id === actorId ? ' (yo)' : ''}` }))}
              onChange={changeOwner}
            />
          </div>
        ) : (
          <h2 className="text-lg font-semibold text-zinc-200">Mi mezcla</h2>
        )}

        <div className="flex items-center gap-3 justify-between sm:justify-end">
          <span className={`text-sm font-medium ${statusColor[status]}`}>{statusLabel[status]}</span>
          <button
            type="button"
            onClick={() => setIsReordering(!isReordering)}
            disabled={isLoadingMix}
            className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors border whitespace-nowrap ${isReordering ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white'}`}
          >
            {isReordering ? '✓ Listo' : '⇅ Reordenar'}
          </button>
        </div>
      </div>

      <div className={`space-y-3 transition-opacity ${isLoadingMix ? 'opacity-50 pointer-events-none' : ''}`}>
        <InEarFader
          label="🎧 Volumen general"
          size="large"
          value={levels[MASTER_CHANNEL] ?? 0}
          onChange={v => setLevel(MASTER_CHANNEL, v)}
          disabled={isReordering}
        />

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortedChannels.map(c => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {sortedChannels.map(channel => (
                <SortableFader key={channel.id} id={channel.id} isReordering={isReordering}>
                  {handle => (
                    <InEarFader
                      label={channel.label}
                      color={channel.color}
                      value={levels[channel.id] ?? 0}
                      onChange={v => setLevel(channel.id, v)}
                      disabled={isReordering}
                      handle={handle}
                    />
                  )}
                </SortableFader>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

    </>
  );

  if (isEngineerOnly) {
    return (
      <div className="space-y-6">
        <InEarChangesPanel currentOwnerId={ownerId} onSelectMix={selectMixFromChange} onApplied={loadOwnerMix} />

        <div className="bg-zinc-900/60 backdrop-blur border border-zinc-700/50 rounded-xl shadow-lg">
          <button
            type="button"
            onClick={() => setIsMixPanelOpen(!isMixPanelOpen)}
            className="w-full flex items-center justify-between gap-3 p-5 sm:px-6 text-left"
          >
            <span>
              <span className="block text-lg font-semibold text-zinc-200">Mezclas</span>
              <span className="block text-xs text-zinc-500">Ver y ajustar los faders de cada miembro</span>
            </span>
            <svg className={`w-5 h-5 text-zinc-500 transition-transform ${isMixPanelOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>

          {isMixPanelOpen && (
            <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-6 animate-in slide-in-from-top-2 fade-in duration-200">
              {mixControls || (
                <p className="text-sm text-zinc-500">Aún no hay miembros marcados como voz o instrumento.</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (performers.length === 0) {
    return (
      <div className="bg-zinc-900/60 p-8 rounded-xl border border-zinc-700/50 text-center text-zinc-400">
        Aún no hay miembros marcados como voz o instrumento. Márcalo en tu Perfil (sección In-Ears) o pídele a un administrador que lo haga desde Usuarios.
      </div>
    );
  }

  if (!ownerId) {
    return (
      <div className="bg-zinc-900/60 p-8 rounded-xl border border-zinc-700/50 text-center text-zinc-400">
        Para tener tu mezcla personal, marca en tu Perfil (sección In-Ears) si cantas o qué instrumento tocas.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {mixControls}

      {/* Al marcar un cambio como aplicado, se muestra esa mezcla con sus niveles actuales */}
      {canManage && <InEarChangesPanel currentOwnerId={ownerId} onSelectMix={selectMixFromChange} onApplied={loadOwnerMix} />}
    </div>
  );
}
