'use client';

import { INSTRUMENTS } from '@/lib/inEars';

export interface InEarFlags {
  isVocalist: boolean;
  instruments: string[];
  isSoundEngineer: boolean;
}

// Casillas para marcar si un miembro es voz, qué instrumentos toca y si es ingeniero de audio
export default function InEarFlagsFields({ value, onChange, disabled = false }: { value: InEarFlags; onChange: (value: InEarFlags) => void; disabled?: boolean }) {
  const toggleInstrument = (instrument: string) => {
    const instruments = value.instruments.includes(instrument)
      ? value.instruments.filter(i => i !== instrument)
      : [...value.instruments, instrument];
    onChange({ ...value, instruments });
  };

  const chipClass = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-sm font-medium border transition-colors disabled:opacity-50 ${
      active
        ? 'bg-purple-500/15 border-purple-500/50 text-purple-300'
        : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
    }`;

  return (
    <div className="space-y-4">
      <div>
        <span className="block text-xs text-zinc-500 uppercase font-semibold mb-2">Voz</span>
        <button type="button" disabled={disabled} onClick={() => onChange({ ...value, isVocalist: !value.isVocalist })} className={chipClass(value.isVocalist)}>
          🎤 Canto
        </button>
      </div>

      <div>
        <span className="block text-xs text-zinc-500 uppercase font-semibold mb-2">Instrumentos</span>
        <div className="flex flex-wrap gap-2">
          {INSTRUMENTS.map(instrument => (
            <button
              key={instrument}
              type="button"
              disabled={disabled}
              onClick={() => toggleInstrument(instrument)}
              className={chipClass(value.instruments.includes(instrument))}
            >
              {instrument}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="block text-xs text-zinc-500 uppercase font-semibold mb-2">Audio</span>
        <button type="button" disabled={disabled} onClick={() => onChange({ ...value, isSoundEngineer: !value.isSoundEngineer })} className={chipClass(value.isSoundEngineer)}>
          🎧 Ingeniero de audio
        </button>
      </div>
    </div>
  );
}
