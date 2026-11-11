import webpush, { type PushSubscription } from 'web-push';
import { randomBytes } from 'crypto';
import User from '@/models/User';
import NotificationLog from '@/models/NotificationLog';
import { wantsNotification, type NotificationPrefs, type NotificationType } from '@/lib/notificationPrefs';

// Único lugar donde se configura web-push. Las llaves deben ser las mismas que usa
// el navegador al suscribirse (NEXT_PUBLIC_VAPID_PUBLIC_KEY).
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const isConfigured = Boolean(publicKey && privateKey);

if (publicKey && privateKey) {
  webpush.setVapidDetails('mailto:isaias.chacon.fl@gmail.com', publicKey, privateKey);
}

export type PushPayload = { title: string; body: string; url?: string };
// Los destinatarios deben traer `notificationPrefs` (ojo con los `.select()`)
type PushRecipient = { _id?: unknown; pushSubscriptions?: PushSubscription[] | null; notificationPrefs?: NotificationPrefs | null };

// Envía la notificación a todos los dispositivos de los usuarios en paralelo,
// omitiendo a quienes desactivaron ese tipo de notificación en su Perfil.
// Las suscripciones que el servicio de push reporta como inexistentes (404/410:
// app desinstalada, datos borrados, permiso revocado) se eliminan de la base.
// Devuelve cuántos dispositivos lo recibieron (`sent`), cuántos fallaron (`failed`, incluye
// los eliminados) y cuántos destinatarios lo tienen desactivado (`optedOut`).
export type PushResult = { sent: number; failed: number; optedOut: number; error?: string };

export async function sendPush(type: NotificationType, recipients: PushRecipient[], payload: PushPayload): Promise<PushResult> {
  const wanted = recipients.filter(r => wantsNotification(r.notificationPrefs, type));
  const optedOut = recipients.length - wanted.length;
  if (!isConfigured) {
    console.warn('Push no configurado: faltan NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY');
    return { sent: 0, failed: 0, optedOut, error: 'not-configured' };
  }

  // Un mismo dispositivo pudo quedar registrado en varias cuentas: enviar una sola vez
  const devices = new Map<string, { sub: PushSubscription; users: unknown[] }>();
  for (const recipient of wanted) {
    for (const sub of recipient.pushSubscriptions ?? []) {
      if (!sub?.endpoint) continue;
      const device = devices.get(sub.endpoint) ?? { sub, users: [] };
      if (recipient._id) device.users.push(recipient._id);
      devices.set(sub.endpoint, device);
    }
  }
  if (devices.size === 0) return { sent: 0, failed: 0, optedOut };

  const list = [...devices.values()];
  const subs = list.map(d => d.sub);

  // Registro de seguimiento por dispositivo. Si falla, la notificación se manda igual, sin seguimiento.
  let logs: { _id: unknown; token: string }[] = [];
  try {
    logs = await NotificationLog.insertMany(list.map(d => ({
      type, title: payload.title, body: payload.body, url: payload.url,
      users: d.users, endpoint: d.sub.endpoint, token: randomBytes(16).toString('hex'),
    })));
  } catch (err) {
    console.error('Error al registrar el seguimiento de notificaciones:', err);
  }

  // `urgency: 'high'`: que Android lo entregue al momento aunque el teléfono esté en reposo
  // (Doze); con prioridad normal puede retrasarlo o juntarlo hasta que el teléfono despierte.
  const results = await Promise.allSettled(subs.map((sub, i) => webpush.sendNotification(sub, JSON.stringify(
    logs[i] ? { ...payload, trackId: String(logs[i]._id), trackToken: logs[i].token } : payload
  ), { urgency: 'high' })));

  const deadEndpoints: string[] = [];
  const errors: string[] = [];
  const failedLogs: { id: unknown; error: string }[] = [];
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') return;
    const statusCode = (result.reason as { statusCode?: number })?.statusCode;
    errors.push(String(statusCode ?? (result.reason as Error)?.message ?? 'error'));
    if (statusCode === 404 || statusCode === 410) deadEndpoints.push(subs[i].endpoint);
    else console.error('Push error:', result.reason);
    if (logs[i]) failedLogs.push({ id: logs[i]._id, error: errors[errors.length - 1] });
  });

  if (failedLogs.length > 0) {
    try {
      await NotificationLog.bulkWrite(failedLogs.map(f => ({
        updateOne: { filter: { _id: f.id }, update: { $set: { status: 'failed', error: f.error } } },
      })));
    } catch (err) {
      console.error('Error al actualizar el seguimiento de notificaciones:', err);
    }
  }

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

  const failed = errors.length;
  return { sent: subs.length - failed, failed, optedOut, ...(failed ? { error: errors.join(', ') } : {}) };
}
