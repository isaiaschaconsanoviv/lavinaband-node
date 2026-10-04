import webpush, { type PushSubscription } from 'web-push';
import User from '@/models/User';

// Único lugar donde se configura web-push. Las llaves deben ser las mismas que usa
// el navegador al suscribirse (NEXT_PUBLIC_VAPID_PUBLIC_KEY).
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const isConfigured = Boolean(publicKey && privateKey);

if (publicKey && privateKey) {
  webpush.setVapidDetails('mailto:isaias.chacon.fl@gmail.com', publicKey, privateKey);
}

export type PushPayload = { title: string; body: string; url?: string };
type PushRecipient = { pushSubscriptions?: PushSubscription[] | null };

// Envía la notificación a todos los dispositivos de los usuarios en paralelo.
// Las suscripciones que el servicio de push reporta como inexistentes (404/410:
// app desinstalada, datos borrados, permiso revocado) se eliminan de la base.
export async function sendPush(recipients: PushRecipient[], payload: PushPayload) {
  if (!isConfigured) {
    console.warn('Push no configurado: faltan NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY');
    return;
  }

  // Un mismo dispositivo pudo quedar registrado en varias cuentas: enviar una sola vez
  const subscriptions = new Map<string, PushSubscription>();
  for (const recipient of recipients) {
    for (const sub of recipient.pushSubscriptions ?? []) {
      if (sub?.endpoint) subscriptions.set(sub.endpoint, sub);
    }
  }
  if (subscriptions.size === 0) return;

  const body = JSON.stringify(payload);
  const subs = [...subscriptions.values()];
  const results = await Promise.allSettled(subs.map(sub => webpush.sendNotification(sub, body)));

  const deadEndpoints: string[] = [];
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') return;
    const statusCode = (result.reason as { statusCode?: number })?.statusCode;
    if (statusCode === 404 || statusCode === 410) deadEndpoints.push(subs[i].endpoint);
    else console.error('Push error:', result.reason);
  });

  if (deadEndpoints.length > 0) {
    try {
      await User.updateMany(
        { 'pushSubscriptions.endpoint': { $in: deadEndpoints } },
        { $pull: { pushSubscriptions: { endpoint: { $in: deadEndpoints } } } }
      );
    } catch (err) {
      console.error('Error al limpiar suscripciones push:', err);
    }
  }
}
