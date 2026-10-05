'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DEFAULT_USER_COLOR } from '@/lib/userColors';
import { SPECIAL_EVENT_BADGE_CLASS, SPECIAL_EVENT_BADGE_STYLE, SPECIAL_EVENT_STRIPES } from '@/lib/specialEvent';

type CalendarAssignment = {
  _id: string;
  sundayDate: string;
  thursdayDate: string;
  assignedUser: { name: string; roleColor?: string };
};

export type CalendarSpecialEvent = {
  _id: string;
  title: string;
  dayKey: string; // YYYY-MM-DD en la zona horaria de la banda
};

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

// Las fechas del rol son días de calendario (medianoche UTC): todo se calcula en UTC
const keyOf = (date: Date) => date.toISOString().slice(0, 10);
const firstName = (name: string) => name.trim().split(/\s+/)[0];

// Vista de calendario del Rol: mes con semanas de Domingo a Sábado. Los días del set list
// de cada turno (Domingo y Jueves) llevan "Mi color" del encargado. Los set lists de eventos
// especiales llevan rayado blanco con ⭐ y su nombre; si caen en un día del turno, el borde
// conserva el color del encargado y el rayado va sobre su color.
export default function RoleCalendar({ assignments, specialEvents, todayKey }: { assignments: CalendarAssignment[], specialEvents: CalendarSpecialEvent[], todayKey: string }) {
  const [month, setMonth] = useState(() => {
    const [y, m] = todayKey.split('-').map(Number);
    return { year: y, month: m - 1 };
  });

  // Día de set list (YYYY-MM-DD) → turno al que pertenece
  const turnByDay = new Map<string, CalendarAssignment>();
  for (const a of assignments) {
    turnByDay.set(a.sundayDate.slice(0, 10), a);
    turnByDay.set(a.thursdayDate.slice(0, 10), a);
  }

  // Día → eventos especiales de ese día
  const specialsByDay = new Map<string, CalendarSpecialEvent[]>();
  for (const e of specialEvents) {
    specialsByDay.set(e.dayKey, [...(specialsByDay.get(e.dayKey) || []), e]);
  }

  const first = new Date(Date.UTC(month.year, month.month, 1));
  const gridStart = first.getTime() - first.getUTCDay() * DAY_MS;
  const daysInMonth = new Date(Date.UTC(month.year, month.month + 1, 0)).getUTCDate();
  const weeks = Math.ceil((first.getUTCDay() + daysInMonth) / 7);
  const days = Array.from({ length: weeks * 7 }, (_, i) => new Date(gridStart + i * DAY_MS));

  const monthLabel = first.toLocaleDateString('es-ES', { month: 'long', year: 'numeric', timeZone: 'UTC' });


  const hasSpecialInMonth = days.some(day => day.getUTCMonth() === month.month && specialsByDay.has(keyOf(day)));

  const changeMonth = (delta: number) => {
    setMonth(prev => {
      const d = new Date(Date.UTC(prev.year, prev.month + delta, 1));
      return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
    });
  };

  const dayStyle = (color: string | undefined, isSpecial: boolean) => {
    if (color && isSpecial) return { borderColor: color, backgroundColor: `${color}59`, backgroundImage: SPECIAL_EVENT_STRIPES };
    if (color) return { borderColor: color, backgroundColor: `${color}59` };
    if (isSpecial) return { borderColor: 'rgba(255, 255, 255, 0.6)', backgroundColor: 'rgba(39, 39, 42, 0.8)', backgroundImage: SPECIAL_EVENT_STRIPES };
    return undefined;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => changeMonth(-1)} className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white transition-colors" title="Mes anterior">‹</button>
        <h4 className="text-lg font-semibold text-white capitalize">{monthLabel}</h4>
        <button onClick={() => changeMonth(1)} className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white transition-colors" title="Mes siguiente">›</button>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="text-center text-xs font-semibold text-zinc-500 uppercase pb-1">{d}</div>
        ))}
        {days.map(day => {
          const key = keyOf(day);
          const turn = turnByDay.get(key);
          const specials = specialsByDay.get(key) || [];
          const inMonth = day.getUTCMonth() === month.month;
          const color = turn ? turn.assignedUser.roleColor || DEFAULT_USER_COLOR : undefined;
          const style = dayStyle(color, specials.length > 0);
          // Días de set list que ya pasaron: más tenues
          const dim = !inMonth ? 'opacity-35' : style && key < todayKey ? 'opacity-50' : '';
          return (
            <div
              key={key}
              title={[turn?.assignedUser.name, ...specials.map(e => `⭐ ${e.title}`)].filter(Boolean).join(' · ') || undefined}
              className={`relative min-h-14 sm:min-h-20 min-w-0 rounded-lg border p-1 sm:p-1.5 flex flex-col gap-0.5 ${dim} ${style ? '' : 'border-zinc-800 bg-zinc-900/40'} ${turn && specials.length ? 'border-2' : ''} ${key === todayKey ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : ''}`}
              style={style}
            >
              <span className={`text-xs sm:text-sm ${style ? 'font-bold text-white' : 'text-zinc-300'}`}>{day.getUTCDate()}</span>
              <div className="mt-auto flex flex-col min-w-0">
                {specials.map(e => (
                  <Link key={e._id} href={`/setlists/${e._id}`} className="text-[10px] sm:text-xs font-bold text-white hover:underline truncate">
                    ⭐ {e.title}
                  </Link>
                ))}
                {turn && (
                  <span className="text-[10px] sm:text-xs font-semibold truncate" style={{ color }}>
                    {firstName(turn.assignedUser.name)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hasSpecialInMonth && (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${SPECIAL_EVENT_BADGE_CLASS}`} style={SPECIAL_EVENT_BADGE_STYLE}>
          ⭐ Evento especial
        </span>
      )}
    </div>
  );
}
