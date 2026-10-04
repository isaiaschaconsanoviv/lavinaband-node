'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { NOTIFICATION_TYPES, wantsNotification, type NotificationPrefs, type NotificationType } from '@/lib/notificationPrefs';

// Casillas para elegir qué tipos de notificación recibir. Se guardan al momento y
// aplican a todos los dispositivos de la cuenta.
export default function NotificationPrefsForm({ types, initialPrefs }: { types: NotificationType[]; initialPrefs: NotificationPrefs }) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(initialPrefs);
  const [savingType, setSavingType] = useState<NotificationType | null>(null);

  const toggle = async (type: NotificationType) => {
    const enabled = !wantsNotification(prefs, type);
    setPrefs(prev => ({ ...prev, [type]: enabled }));
    setSavingType(type);
    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, enabled })
      });
      if (!res.ok) throw new Error();
    } catch {
      setPrefs(prev => ({ ...prev, [type]: !enabled }));
      toast.error('No se pudo guardar la preferencia');
    } finally {
      setSavingType(null);
    }
  };

  if (types.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm text-zinc-400">Elige qué notificaciones quieres recibir (aplica a todos tus dispositivos):</p>
      <ul className="divide-y divide-zinc-800/80 rounded-xl border border-zinc-700/50 bg-zinc-800/30">
        {NOTIFICATION_TYPES.filter(t => types.includes(t.key)).map(t => {
          const enabled = wantsNotification(prefs, t.key);
          return (
            <li key={t.key}>
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                onClick={() => toggle(t.key)}
                disabled={savingType === t.key}
                className="w-full flex items-center justify-between gap-4 px-4 py-3 text-left hover:bg-zinc-800/50 transition-colors disabled:opacity-70"
              >
                <span>
                  <span className="block text-sm font-medium text-zinc-200">{t.label}</span>
                  <span className="block text-xs text-zinc-500">{t.description}</span>
                </span>
                <span className={`relative shrink-0 w-10 h-6 rounded-full transition-colors ${enabled ? 'bg-blue-600' : 'bg-zinc-700'}`}>
                  <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-4' : ''}`} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
