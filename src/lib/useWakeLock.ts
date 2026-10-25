'use client';

import { useEffect } from 'react';

// Evita que la pantalla se apague mientras la página está abierta (presentación y vista en
// vivo). El navegador suelta el bloqueo al cambiar de app, así que se pide otra vez al volver.
// Si el navegador no lo soporta, no hace nada.
export function useWakeLock() {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const request = () => {
      if (document.visibilityState !== 'visible' || !('wakeLock' in navigator)) return;
      navigator.wakeLock.request('screen').then(l => { lock = l; }).catch(() => {});
    };
    request();
    document.addEventListener('visibilitychange', request);
    return () => {
      document.removeEventListener('visibilitychange', request);
      lock?.release().catch(() => {});
    };
  }, []);
}
