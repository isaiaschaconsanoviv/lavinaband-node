'use client';

import type { ReactNode } from 'react';
import { IN_EAR_LEVELS, clampLevel, formatLevel, stepLevel } from '@/lib/inEars';

interface InEarFaderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  color?: string;
  disabled?: boolean;
  size?: 'normal' | 'large';
  // Contenido a la izquierda del nombre (por ejemplo, el control para reordenar)
  handle?: ReactNode;
}

// Índice de la marca del 0 en el medidor
const ZERO_INDEX = IN_EAR_LEVELS.indexOf(0);

// Fader horizontal estilo medidor de consola: un cuadrito por posición (-15, -12, -10 ... +15)
// que se ilumina en verde desde -15 hasta el valor actual
export default function InEarFader({ label, value: rawValue, onChange, color, disabled = false, size = 'normal', handle }: InEarFaderProps) {
  const value = clampLevel(rawValue);
  const index = IN_EAR_LEVELS.indexOf(value);
  const isLit = (level: number) => level <= value;
  const segmentHeight = size === 'large' ? 'h-7' : 'h-5';

  return (
    <div className={`rounded-xl border p-3 sm:p-4 transition-colors ${size === 'large' ? 'bg-zinc-900/80 border-sky-500/30' : 'bg-zinc-900/60 border-zinc-700/50'}`}>
      <div className="flex items-center gap-2 mb-2">
        {handle}
        {color && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />}
        <span className={`flex-1 min-w-0 truncate font-medium ${size === 'large' ? 'text-base text-sky-300' : 'text-sm text-zinc-200'}`}>{label}</span>
        <span className={`font-mono font-bold tabular-nums ${size === 'large' ? 'text-xl' : 'text-base'} ${value === 0 ? 'text-zinc-400' : 'text-white'}`}>
          {formatLevel(value)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(stepLevel(value, -1))}
          disabled={disabled || index === 0}
          className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-bold transition-colors disabled:opacity-40"
          title="Bajar una posición"
        >
          −
        </button>

        <div className="relative flex-1 min-w-0">
          <div className="flex items-center gap-[2px]">
            {IN_EAR_LEVELS.map(level => (
              <div
                key={level}
                className={`flex-1 ${segmentHeight} rounded-[2px] transition-colors ${
                  isLit(level)
                    ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]'
                    : level === 0 ? 'bg-zinc-600' : 'bg-zinc-800'
                }`}
              />
            ))}
          </div>
          {/* Marca del 0 debajo del medidor */}
          <div className="relative h-1.5 mt-0.5">
            <div className="absolute top-0 w-[2px] h-full bg-zinc-400 -translate-x-1/2" style={{ left: `${(ZERO_INDEX + 0.5) / IN_EAR_LEVELS.length * 100}%` }} />
          </div>
          {/* Control nativo invisible encima del medidor: permite arrastrar, tocar y usar el teclado */}
          <input
            type="range"
            min={0}
            max={IN_EAR_LEVELS.length - 1}
            step={1}
            value={index}
            disabled={disabled}
            onChange={e => onChange(IN_EAR_LEVELS[Number(e.target.value)])}
            aria-valuetext={formatLevel(value)}
            aria-label={label}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
        </div>

        <button
          type="button"
          onClick={() => onChange(stepLevel(value, 1))}
          disabled={disabled || index === IN_EAR_LEVELS.length - 1}
          className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-bold transition-colors disabled:opacity-40"
          title="Subir una posición"
        >
          +
        </button>
      </div>
    </div>
  );
}
