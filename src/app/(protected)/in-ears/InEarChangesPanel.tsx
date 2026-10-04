'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import ConfirmModal from '@/components/ConfirmModal';
import { formatLevel, formatStepChange } from '@/lib/inEars';

interface InEarChangeItem {
  _id: string;
  mix?: { _id: string; name: string } | null;
  changedBy?: { name: string } | null;
  appliedBy?: { name: string } | null;
  appliedAt?: string;
  createdAt: string;
  changes: { channel: string; label: string; from: number; to: number }[];
}

const REFRESH_MS = 20000;

// Panel del ingeniero de audio: cambios recientes de las mezclas y botón "Aplicado"
interface InEarChangesPanelProps {
  // Mezcla que el ingeniero tiene abierta, para resaltar sus cambios
  currentOwnerId?: string | null;
  // Abrir la mezcla de quien pidió el cambio (al tocar la tarjeta)
  onSelectMix?: (mixOwnerId: string) => void;
  onApplied?: (mixOwnerId: string) => void;
}

export default function InEarChangesPanel({ currentOwnerId, onSelectMix, onApplied }: InEarChangesPanelProps) {
  const [items, setItems] = useState<InEarChangeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/in-ears/changes');
      const data = await res.json();
      if (data.success) setItems(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => clearInterval(interval);
  }, [load]);

  const markApplied = async (item: InEarChangeItem) => {
    setApplyingId(item._id);
    try {
      const res = await fetch(`/api/in-ears/changes/${item._id}`, { method: 'POST' });
      if (!res.ok) throw new Error();
      if (item.mix?._id) onApplied?.(item.mix._id);
      await load();
    } catch {
      toast.error('No se pudo marcar como aplicado');
    } finally {
      setApplyingId(null);
    }
  };

  const deleteItem = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/in-ears/changes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setItems(prev => prev.filter(i => i._id !== id));
    } catch {
      toast.error('No se pudo borrar el cambio');
    } finally {
      setDeletingId(null);
    }
  };

  const clearAll = async () => {
    setIsConfirmingClear(false);
    try {
      const res = await fetch('/api/in-ears/changes', { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setItems([]);
      toast.success('Historial de cambios borrado');
    } catch {
      toast.error('No se pudo borrar el historial');
    }
  };

  const pendingCount = items.filter(i => !i.appliedAt).length;

  return (
    <div className="bg-zinc-900/60 backdrop-blur border border-zinc-700/50 rounded-xl p-5 sm:p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h3 className="text-lg font-semibold text-sky-400 whitespace-nowrap truncate">Cambios recientes</h3>
        <div className="flex items-center gap-1 shrink-0">
          {pendingCount > 0 && (
            <span
              className="flex items-center gap-1 px-2 h-8 mr-1 text-xs font-bold rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30"
              title={pendingCount === 1 ? '1 cambio pendiente' : `${pendingCount} cambios pendientes`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {pendingCount}
            </span>
          )}
          <button
            type="button"
            onClick={load}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Actualizar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
          {items.length > 0 && (
            <button
              type="button"
              onClick={() => setIsConfirmingClear(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              title="Borrar todo el historial"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-zinc-500">Aún no hay cambios en las mezclas.</p>
      ) : (
        <ul className="space-y-3">
          {items.map(item => (
            <li
              key={item._id}
              onClick={() => item.mix?._id && onSelectMix?.(item.mix._id)}
              title={item.mix ? `Abrir la mezcla de ${item.mix.name}` : undefined}
              className={`p-4 rounded-lg border transition-colors ${item.mix ? 'cursor-pointer' : ''} ${
                item.appliedAt ? 'bg-zinc-900/30 border-zinc-800 opacity-70 hover:opacity-100' : 'bg-zinc-950/60 border-zinc-700/60 hover:border-sky-500/50'
              } ${item.mix?._id && item.mix._id === currentOwnerId ? 'ring-1 ring-sky-500/60' : ''}`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <p className="font-medium text-zinc-100 truncate">Mezcla de {item.mix?.name ?? 'Usuario eliminado'}</p>
                  <p className="text-xs text-zinc-500 truncate">
                    {item.changedBy?.name ?? 'Usuario eliminado'} · {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: es })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); deleteItem(item._id); }}
                  disabled={deletingId === item._id}
                  className="w-8 h-8 shrink-0 flex items-center justify-center -mt-1 -mr-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                  title="Borrar este cambio"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
              <ul className="space-y-1">
                {item.changes.map(change => (
                  <li key={change.channel} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-zinc-300 truncate">{change.label}</span>
                    {/* Primero los cuadritos (como en la notificación) y después los valores de la consola */}
                    <span className="whitespace-nowrap text-right">
                      <span className={change.to > change.from ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>{formatStepChange(change.from, change.to)}</span>
                      <span className="ml-1.5 font-mono tabular-nums text-xs text-zinc-500">
                        ({formatLevel(change.from)} → {formatLevel(change.to)})
                      </span>
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 pt-3 border-t border-zinc-800/60">
                {item.appliedAt ? (
                  <p className="text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1.5 py-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Aplicado{item.appliedBy?.name ? ` por ${item.appliedBy.name}` : ''}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); markApplied(item); }}
                    disabled={applyingId === item._id}
                    className="w-full py-2 text-sm font-medium bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {applyingId === item._id ? 'Guardando…' : 'Marcar aplicado'}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        isOpen={isConfirmingClear}
        title="Borrar historial"
        message="¿Seguro que deseas borrar todos los cambios recientes? Los niveles de las mezclas no se modifican."
        confirmText="Borrar todo"
        cancelText="Cancelar"
        isDanger={true}
        onConfirm={clearAll}
        onCancel={() => setIsConfirmingClear(false)}
      />
    </div>
  );
}
