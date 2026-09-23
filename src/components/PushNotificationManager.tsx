'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationManager({ hideWhenSubscribed }: { hideWhenSubscribed?: boolean }) {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
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
      const registration = await navigator.serviceWorker.ready;
      
      const pubKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!pubKey) {
        throw new Error('No public key provided.');
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(pubKey),
      });

      setSubscription(sub);

      // Send to backend
      const res = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      });

      if (res.ok) {
        toast.success('¡Notificaciones activadas!');
      } else {
        toast.error('Error al guardar suscripción en el servidor.');
      }
    } catch (error: any) {
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
