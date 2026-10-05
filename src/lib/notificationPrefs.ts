// Tipos de notificación que cada usuario puede activar o desactivar desde su Perfil
// (compartido entre cliente y servidor). Todos están activados por defecto.

export type NotificationAudience = 'member' | 'engineer' | 'admin';

export const NOTIFICATION_TYPES = [
  { key: 'announcements', label: 'Anuncios', description: 'Cuando se publica un anuncio nuevo', audience: 'member' },
  { key: 'setlistReady', label: 'Set lists listos', description: 'Cuando un set list queda listo para revisarse', audience: 'member' },
  { key: 'setlistCollaborator', label: 'Colaboración en set lists', description: 'Cuando te agregan como colaborador de un set list', audience: 'member' },
  { key: 'roleTurns', label: 'Rol de Set Lists', description: 'Cuando te asignan un turno o responden tu solicitud para el rol', audience: 'member' },
  { key: 'roleReminder', label: 'Recordatorio de tu turno', description: 'El lunes antes de que empiece tu semana en el Rol de Set Lists', audience: 'member' },
  { key: 'inEars', label: 'Cambios de In-Ears', description: 'Cuando un miembro ajusta su mezcla', audience: 'engineer' },
  { key: 'turnConfirmed', label: 'Turnos confirmados', description: 'Cuando el encargado confirma de enterado su turno', audience: 'admin' },
  { key: 'roleRequests', label: 'Solicitudes de Rol', description: 'Cuando alguien pide unirse al Rol de Set Lists', audience: 'admin' },
  { key: 'songSuggestions', label: 'Sugerencias de canciones', description: 'Cuando alguien sugiere una canción', audience: 'admin' },
] as const satisfies readonly { key: string; label: string; description: string; audience: NotificationAudience }[];

export type NotificationType = typeof NOTIFICATION_TYPES[number]['key'];
export type NotificationPrefs = Partial<Record<NotificationType, boolean>>;

export function isNotificationType(key: unknown): key is NotificationType {
  return NOTIFICATION_TYPES.some(t => t.key === key);
}

// Si no hay preferencia guardada, el tipo está activado
export function wantsNotification(prefs: NotificationPrefs | null | undefined, type: NotificationType) {
  return prefs?.[type] !== false;
}

// Tipos que le aplican a un usuario según su cuenta (los invitados no reciben ninguno)
export function notificationTypesFor(user: { role?: string; isSoundEngineer?: boolean }) {
  if (user.role === 'GUEST') return [];
  return NOTIFICATION_TYPES.filter(t =>
    t.audience === 'member' ||
    (t.audience === 'engineer' && user.isSoundEngineer) ||
    (t.audience === 'admin' && user.role === 'ADMIN')
  );
}
