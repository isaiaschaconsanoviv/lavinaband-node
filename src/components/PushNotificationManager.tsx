'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { isPushSupported, saveSubscription, subscribeBrowser } from '@/lib/pushClient';

export default function PushNotificationManager({ hideWhenSubscribed }: { hideWhenSubscribed?: boolean }) {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isPushSupported()) {
      setIsSupported(true);
      registerServiceWorker();
    } else {
      setLoading(false);
    }
  }, []);

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    } catch (error) {
      console.error('SW registration failed:', error);
    } finally {
      setLoading(false);
    }
  }

  async function subscribeToPush() {
    try {
      setLoading(true);
      const sub = await subscribeBrowser();
      setSubscription(sub);

      if (await saveSubscription(sub)) {
        toast.success('¡Notificaciones activadas!');
      } else {
        toast.error('Error al guardar suscripción en el servidor.');
      }
    } catch (error) {
      console.error(error);
      toast.error('No se pudo activar las notificaciones.');
    } finally {
      setLoading(false);
    }
  }

  if (hideWhenSubscribed && subscription) return null;

  if (!isSupported) {
    return (
      <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 text-sm text-zinc-400">
        Las notificaciones push no están soportadas en este navegador.
      </div>
    );
  }

  return (
    <div className="p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div>
        <h3 className="font-semibold text-zinc-200">Notificaciones Push</h3>
        <p className="text-sm text-zinc-400">
          {subscription
            ? 'Estás recibiendo notificaciones en este dispositivo.'
            : 'Activa las notificaciones para enterarte cuando haya nuevos anuncios.'}
        </p>
      </div>
      <button
        onClick={subscribeToPush}
        disabled={loading || !!subscription}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
      >
        {loading ? 'Cargando...' : subscription ? 'Activadas' : 'Activar Notificaciones'}
      </button>
    </div>
  );
}
