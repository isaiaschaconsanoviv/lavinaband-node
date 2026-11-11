import mongoose from 'mongoose';

// Seguimiento de cada notificación push, una por dispositivo (ver `sendPush` en lib/push.ts):
// - `status`: si el servicio de push (FCM, Apple, Mozilla) la aceptó o la rechazó.
// - `receivedAt`: el service worker del dispositivo la recibió y la mostró.
// - `openedAt` / `dismissedAt`: la persona la tocó o la descartó.
// El service worker reporta con `token` (POST /api/notifications/track), sin sesión.
// Se borran solas a los 90 días.
const NotificationLogSchema = new mongoose.Schema({
  type: { type: String, required: true },
  title: { type: String },
  body: { type: String },
  url: { type: String },
  // Dueños del dispositivo (un dispositivo puede estar registrado en más de una cuenta)
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  endpoint: { type: String },
  token: { type: String, required: true },
  status: { type: String, enum: ['sent', 'failed'], default: 'sent' },
  error: { type: String },
  receivedAt: { type: Date },
  openedAt: { type: Date },
  dismissedAt: { type: Date },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 90 },
});

NotificationLogSchema.index({ users: 1, createdAt: -1 });

export default mongoose.models.NotificationLog || mongoose.model('NotificationLog', NotificationLogSchema);
