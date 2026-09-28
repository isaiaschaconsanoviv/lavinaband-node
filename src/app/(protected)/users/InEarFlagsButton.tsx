'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { updateUserInEarFlags } from '@/app/actions/user.actions';
import InEarFlagsFields, { type InEarFlags } from '@/components/inEars/InEarFlagsFields';

// Botón para que el admin marque voz, instrumentos e ingeniero de un usuario
export default function InEarFlagsButton({ userId, userName, initialFlags, fullWidth = false }: { userId: string; userName: string; initialFlags: InEarFlags; fullWidth?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [flags, setFlags] = useState(initialFlags);
  const [loading, setLoading] = useState(false);

  const summary = [
    initialFlags.isVocalist && '🎤',
    initialFlags.instruments.length > 0 && `🎸${initialFlags.instruments.length}`,
    initialFlags.isSoundEngineer && '🎧',
  ].filter(Boolean).join(' ');

  const open = () => {
    setFlags(initialFlags);
    setIsOpen(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateUserInEarFlags(userId, flags);
      toast.success(`Se actualizó In-Ears de ${userName}`);
      setIsOpen(false);
    } catch {
      toast.error(`No se pudo actualizar In-Ears de ${userName}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        className={`${fullWidth ? 'w-full justify-center' : ''} px-3 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap`}
        title="Voz, instrumentos e ingeniero de audio"
      >
        In-Ears {summary && <span className="text-xs text-zinc-400">{summary}</span>}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 pt-24 sm:pt-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-700/50 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-1">In-Ears</h3>
              <p className="text-zinc-400 text-sm mb-5">{userName}</p>
              <InEarFlagsFields value={flags} onChange={setFlags} disabled={loading} />
            </div>
            <div className="bg-zinc-950/50 p-4 border-t border-zinc-800/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="bg-blue-600/90 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
