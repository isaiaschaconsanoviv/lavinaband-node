'use client';

import { useEffect } from 'react';
import { syncSubscription } from '@/lib/pushClient';

// Al abrir la app con sesión iniciada, vincula en silencio este dispositivo con la
// cuenta actual (si ya tiene permiso de notificaciones). No muestra nada.
export default function PushSubscriptionSync() {
  useEffect(() => {
    syncSubscription().catch(err => console.error('Error al sincronizar notificaciones:', err));
  }, []);
  return null;
}
