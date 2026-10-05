'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveRoleView, type RoleView } from '@/lib/roleView';

// Pestañas "Calendario | Tarjetas" del Rol. Guardan la vista en una cookie y piden al
// servidor la página otra vez: la página dibuja solo la vista elegida (sin parpadeo al cargar).
export default function RoleViewTabs({ view }: { view: RoleView }) {
  const router = useRouter();
  const [selected, setSelected] = useState(view);
  const [isPending, startTransition] = useTransition();

  const choose = (next: RoleView) => {
    if (next === selected) return;
    setSelected(next);
    saveRoleView(next);
    startTransition(() => router.refresh());
  };

  const tab = (value: RoleView, label: string) => (
    <button
      type="button"
      onClick={() => choose(value)}
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${selected === value ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'}`}
    >
      {label}
    </button>
  );

  return (
    <div className={`inline-flex p-1 rounded-lg bg-zinc-800/60 border border-zinc-700/50 ${isPending ? 'opacity-70' : ''}`}>
      {tab('calendar', 'Calendario')}
      {tab('cards', 'Tarjetas')}
    </div>
  );
}
