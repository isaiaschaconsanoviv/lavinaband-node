'use client';

import { useCallback, useSyncExternalStore } from 'react';

// Preferencias de cada dispositivo guardadas en localStorage (vista del Rol, colores del
// set list…). Si el navegador bloquea localStorage, se recuerdan solo mientras la página está abierta.
const EVENT = 'local-pref-change';
const memory = new Map<string, string>();

function read(key: string) {
  try {
    return localStorage.getItem(key) ?? memory.get(key) ?? null;
  } catch {
    return memory.get(key) ?? null;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

export function useLocalPref<T extends string>(key: string, fallback: T, allowed: readonly T[]) {
  const stored = useSyncExternalStore(subscribe, () => read(key), () => null);
  const value = allowed.includes(stored as T) ? (stored as T) : fallback;

  const setValue = useCallback((next: T) => {
    memory.set(key, next);
    try {
      localStorage.setItem(key, next);
    } catch {}
    window.dispatchEvent(new Event(EVENT));
  }, [key]);

  return [value, setValue] as const;
}
