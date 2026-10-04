'use client';

import type { ReactNode } from 'react';
import { IN_EAR_LEVELS, clampLevel, formatLevel, stepLevel } from '@/lib/inEars';

interface InEarFaderProps {
  label: string;
  // En las tiras verticales: nombre del canal y, en el renglón de abajo, el miembro
  title?: string;
  member?: string;
  // Ícono junto al nombre del canal (por ejemplo, 🎤 para el Pastor)
  icon?: string;
  value: number;
  // Nivel que el ingeniero ya aplicó en la consola. Si difiere de `value`, la diferencia
  // se muestra en naranja hasta que lo aplique. Si no se indica, todo está aplicado.
  appliedValue?: number;
  onChange: (value: number) => void;
  color?: string;
  disabled?: boolean;
  size?: 'normal' | 'large';
  // Contenido junto al nombre (por ejemplo, el control para reordenar)
  handle?: ReactNode;
}

// Índice de la marca del 0 en el medidor
const ZERO_INDEX = IN_EAR_LEVELS.indexOf(0);

const LIT_CLASS = 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]';
// Pendiente de aplicar: subir (cuadritos que se van a encender) y bajar (los que se van a apagar)
const PENDING_UP_CLASS = 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]';
const PENDING_DOWN_CLASS = 'bg-amber-400/30 ring-1 ring-inset ring-amber-400/70';
const STEP_BUTTON_CLASS = 'w-9 h-9 shrink-0 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-bold transition-colors disabled:opacity-40';

// Fader estilo medidor de consola: un cuadrito por posición (-15, -12, -10 ... +15) que se
// ilumina en verde desde -15 hasta el valor actual. En celular y tablet es horizontal; en
// pantallas grandes (lg) es una tira vertical con -15 abajo y +15 arriba, como en la consola.
export default function InEarFader({ label, title, member, icon, value: rawValue, appliedValue, onChange, color, disabled = false, size = 'normal', handle }: InEarFaderProps) {
  const value = clampLevel(rawValue);
  const applied = clampLevel(appliedValue ?? rawValue);
  const isPending = applied !== value;
  const index = IN_EAR_LEVELS.indexOf(value);
  const isLarge = size === 'large';
  // Verde hasta lo aplicado; naranja entre lo aplicado y lo pedido
  const segmentClass = (level: number) => {
    if (level <= Math.min(value, applied)) return LIT_CLASS;
    if (level <= Math.max(value, applied)) return value > applied ? PENDING_UP_CLASS : PENDING_DOWN_CLASS;
    return level === 0 ? 'bg-zinc-600' : 'bg-zinc-800';
  };

  const valueLabel = (
    <span
      className={`font-mono font-bold tabular-nums ${isLarge ? 'text-xl' : 'text-base'} ${isPending ? 'text-amber-400' : value === 0 ? 'text-zinc-400' : 'text-white'}`}
      title={isPending ? `Pendiente: el ingeniero aún no aplica el cambio (en consola: ${formatLevel(applied)})` : undefined}
    >
      {formatLevel(value)}
    </span>
  );

  const downButton = (
    <button type="button" onClick={() => onChange(stepLevel(value, -1))} disabled={disabled || index === 0} className={STEP_BUTTON_CLASS} title="Bajar una posición">
      −
    </button>
  );

  const upButton = (
    <button type="button" onClick={() => onChange(stepLevel(value, 1))} disabled={disabled || index === IN_EAR_LEVELS.length - 1} className={STEP_BUTTON_CLASS} title="Subir una posición">
      +
    </button>
  );

  // Control nativo invisible encima del medidor: permite arrastrar, tocar y usar el teclado
  const rangeInput = (vertical: boolean) => (
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
      // Vertical: el mínimo (-15) queda abajo y el máximo (+15) arriba
      style={vertical ? { writingMode: 'vertical-lr', direction: 'rtl' } : undefined}
      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
    />
  );

  return (
    <div className={`h-full rounded-xl border transition-colors ${isLarge ? 'bg-zinc-900/80 border-sky-500/30' : 'bg-zinc-900/60 border-zinc-700/50'}`}>
      {/* Horizontal: celular y tablet */}
      <div className="lg:hidden p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-2">
          {handle}
          {color && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />}
          <span className={`flex-1 min-w-0 truncate font-medium ${isLarge ? 'text-base text-sky-300' : 'text-sm text-zinc-200'}`}>{icon && <span className="mr-1.5">{icon}</span>}{label}</span>
          {valueLabel}
        </div>

        <div className="flex items-center gap-2">
          {downButton}
          <div className="relative flex-1 min-w-0">
            <div className="flex items-center gap-[2px]">
              {IN_EAR_LEVELS.map(level => (
                <div key={level} className={`flex-1 ${isLarge ? 'h-7' : 'h-5'} rounded-[2px] transition-colors ${segmentClass(level)}`} />
              ))}
            </div>
            {/* Marca del 0 debajo del medidor (flotante, para no alterar el centrado con los botones) */}
            <div className="absolute top-full mt-0.5 w-[2px] h-1.5 bg-zinc-400 -translate-x-1/2 pointer-events-none" style={{ left: `${(ZERO_INDEX + 0.5) / IN_EAR_LEVELS.length * 100}%` }} />
            {rangeInput(false)}
          </div>
          {upButton}
        </div>
      </div>

      {/* Vertical: pantallas grandes */}
      <div className={`hidden lg:flex flex-col items-center gap-2 h-full p-3 ${isLarge ? 'w-28' : 'w-24'}`}>
        <div className="flex items-center justify-center gap-1.5 w-full min-h-[2rem]">
          {handle}
          {valueLabel}
        </div>

        {upButton}

        {/* El medidor va centrado en la tira (alineado con los botones y el valor); la escala flota a su izquierda */}
        <div className="relative h-72">
          {/* Escala de la consola: +15 arriba, -15 abajo */}
          <div className="absolute right-full top-0 h-full mr-1.5 flex flex-col-reverse gap-[3px] text-[9px] leading-none font-mono text-zinc-500 text-right">
            {IN_EAR_LEVELS.map(level => (
              <span key={level} className={`flex-1 flex items-center justify-end ${level === 0 ? 'text-zinc-300 font-bold' : ''}`}>
                {formatLevel(level)}
              </span>
            ))}
          </div>
          <div className={`relative h-full ${isLarge ? 'w-7' : 'w-5'}`}>
            <div className="flex flex-col-reverse gap-[3px] h-full">
              {IN_EAR_LEVELS.map(level => (
                <div key={level} className={`flex-1 w-full rounded-[2px] transition-colors ${segmentClass(level)}`} />
              ))}
            </div>
            {rangeInput(true)}
          </div>
        </div>

        {downButton}

        <div className="flex flex-col items-center gap-1 w-full mt-auto pt-1">
          {color && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />}
          <span className={`w-full text-center font-medium leading-tight line-clamp-2 break-words ${isLarge ? 'text-sm text-sky-300' : 'text-xs text-zinc-200'}`} title={label}>
            {icon && <span className="block text-base leading-none mb-1">{icon}</span>}
            {title ?? label}
          </span>
          {member && (
            <span className={`w-full text-center font-medium leading-tight line-clamp-2 break-words ${isLarge ? 'text-sm text-sky-300' : 'text-xs text-zinc-200'}`} title={label}>
              {member}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
