'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  clearPushDisabledOnDevice,
  disablePushOnDevice,
  isPushDisabledOnDevice,
  isPushSupported,
  saveSubscription,
  subscribeBrowser,
} from '@/lib/pushClient';

// Activa (o, con `allowDisable`, desactiva) las notificaciones en este dispositivo.
// Con `hideWhenSubscribed` (Dashboard) no se muestra si ya están activas o si el
// usuario las desactivó a propósito.
export default function PushNotificationManager({ hideWhenSubscribed, allowDisable }: { hideWhenSubscribed?: boolean; allowDisable?: boolean }) {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [disabledByUser, setDisabledByUser] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
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
      setDisabledByUser(isPushDisabledOnDevice());
      setIsBlocked(Notification.permission === 'denied');
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
      clearPushDisabledOnDevice();
      setDisabledByUser(false);
      setSubscription(sub);

      if (await saveSubscription(sub)) {
        toast.success('¡Notificaciones activadas!');
      } else {
        toast.error('Error al guardar suscripción en el servidor.');
      }
    } catch (error) {
      console.error(error);
      setIsBlocked(Notification.permission === 'denied');
      toast.error('No se pudo activar las notificaciones.');
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribeFromPush() {
    try {
      setLoading(true);
      await disablePushOnDevice();
      setSubscription(null);
      setDisabledByUser(true);
      toast.success('Notificaciones desactivadas en este dispositivo');
    } catch (error) {
      console.error(error);
      toast.error('No se pudieron desactivar las notificaciones.');
    } finally {
      setLoading(false);
    }
  }

  if (hideWhenSubscribed && (subscription || disabledByUser)) return null;

  if (!isSupported) {
    return (
      <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 text-sm text-zinc-400">
        Las notificaciones push no están soportadas en este navegador.
      </div>
    );
  }

  const description = subscription
    ? 'Estás recibiendo notificaciones en este dispositivo.'
    : isBlocked
      ? 'Las notificaciones están bloqueadas en este navegador. Habilítalas en su configuración para poder activarlas.'
      : disabledByUser
        ? 'Desactivaste las notificaciones en este dispositivo.'
        : 'Activa las notificaciones para enterarte cuando haya nuevos anuncios.';

  return (
    <div className="p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div>
        <h3 className="font-semibold text-zinc-200">Notificaciones en este dispositivo</h3>
        <p className="text-sm text-zinc-400">{description}</p>
      </div>
      {subscription && allowDisable ? (
        <button
          onClick={unsubscribeFromPush}
          disabled={loading}
          className="px-4 py-2 text-red-400 hover:text-white bg-red-500/10 hover:bg-red-600/80 border border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
        >
          {loading ? 'Cargando...' : 'Desactivar'}
        </button>
      ) : (
        <button
          onClick={subscribeToPush}
          disabled={loading || !!subscription || isBlocked}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
        >
          {loading ? 'Cargando...' : subscription ? 'Activadas' : 'Activar Notificaciones'}
        </button>
      )}
    </div>
  );
}
