'use client';

import type { ReactNode } from 'react';
import { useLocalPref } from '@/lib/useLocalPref';

type View = 'cards' | 'calendar';

// Selector entre la vista de tarjetas (por semana) y la de calendario del Rol.
// Por defecto muestra el calendario; la vista elegida se recuerda en cada dispositivo.
export default function RoleViews({ cards, calendar }: { cards: ReactNode, calendar: ReactNode }) {
  const [view, setView] = useLocalPref<View>('roleView', 'calendar', ['calendar', 'cards']);

  const tab = (value: View, label: string) => (
    <button
      type="button"
      onClick={() => setView(value)}
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === value ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="inline-flex p-1 rounded-lg bg-zinc-800/60 border border-zinc-700/50">
        {tab('calendar', 'Calendario')}
        {tab('cards', 'Tarjetas')}
      </div>
      {view === 'cards' ? cards : calendar}
    </div>
  );
}
