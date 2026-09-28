'use client';

import CustomSelect from '@/components/ui/CustomSelect';
import { keyName, transposeLabel, type SongKey } from '@/lib/chords';

interface ChordTransposerProps {
  // Tono guardado de la canción: es el punto de partida ("Original")
  baseKey: SongKey;
  semitones: number;
  onChange: (semitones: number) => void;
  // Si se proporciona (administradores y miembros), permite guardar el tono elegido en la canción
  onSave?: () => void;
  isSaving?: boolean;
}

// Selector para transponer de semitono en semitono: Original, +0.5, +1 ... +5.5
export default function ChordTransposer({ baseKey, semitones, onChange, onSave, isSaving = false }: ChordTransposerProps) {
  const step = (delta: number) => onChange((semitones + delta + 12) % 12);

  const options = [
    { value: '0', label: `Original · ${keyName(baseKey)}` },
    ...Array.from({ length: 11 }, (_, i) => i + 1).map(i => ({
      value: String(i),
      label: transposeLabel(baseKey, i),
    })),
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-stretch gap-2">
        <button
          type="button"
          onClick={() => step(-1)}
          className="w-10 shrink-0 flex items-center justify-center rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-lg font-bold transition-colors"
          title="Bajar medio tono"
        >
          −
        </button>

        <div className="flex-1 min-w-0">
          <CustomSelect
            name="transpose"
            className="min-w-0"
            options={options}
            value={String(semitones)}
            onChange={val => onChange(Number(val))}
          />
        </div>

        <button
          type="button"
          onClick={() => step(1)}
          className="w-10 shrink-0 flex items-center justify-center rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-lg font-bold transition-colors"
          title="Subir medio tono"
        >
          +
        </button>
      </div>

      {semitones !== 0 && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <button
            type="button"
            onClick={() => onChange(0)}
            disabled={isSaving}
            className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1 disabled:opacity-50"
            title="Volver al tono original"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Restablecer al tono original ({keyName(baseKey)})
          </button>

          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="px-3 py-1.5 text-xs font-medium bg-purple-600/90 hover:bg-purple-500 text-white rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
              title="Guardar este tono para todos"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              {isSaving ? 'Guardando...' : `Guardar ${keyName(baseKey, semitones)} como tono de la canción`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
