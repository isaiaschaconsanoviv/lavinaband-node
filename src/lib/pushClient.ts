// Helpers de notificaciones push para el navegador (no importar desde el servidor)
import { signOut } from 'next-auth/react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
}

// Crea la suscripción del navegador (pide permiso si aún no se ha concedido)
export async function subscribeBrowser() {
  const pubKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!pubKey) throw new Error('No public key provided.');

  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(pubKey),
  });
}

// Vincula la suscripción del dispositivo con la cuenta que tiene la sesión abierta
export async function saveSubscription(sub: PushSubscription) {
  const res = await fetch('/api/notifications/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sub),
  });
  return res.ok;
}

// Se ejecuta al abrir la app: si el dispositivo ya tiene permiso, asegura que su
// suscripción exista y esté guardada en la cuenta actual (sin mostrar nada).
export async function syncSubscription() {
  if (!isPushSupported() || Notification.permission !== 'granted') return;
  const registration = await navigator.serviceWorker.ready;
  const sub = (await registration.pushManager.getSubscription()) ?? (await subscribeBrowser());
  await saveSubscription(sub);
}

// Cierra sesión desvinculando antes este dispositivo de la cuenta, para que los
// avisos de esta cuenta no le lleguen a quien use el dispositivo después.
export async function signOutAndUnlinkPush() {
  try {
    if (isPushSupported()) {
      const registration = await navigator.serviceWorker.getRegistration();
      const sub = await registration?.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/notifications/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
      }
    }
  } catch (err) {
    console.error('Error al desvincular notificaciones:', err);
  }
  await signOut({ callbackUrl: '/auth/login' });
}
