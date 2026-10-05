// "Mi color": el color que identifica a cada miembro en la app (Rol, In-Ears, quién canta…).
// Se guarda en `User.roleColor` (nombre histórico del campo). Cada color solo puede
// tenerlo una persona, salvo el gris por defecto, que significa "sin color elegido".

export const DEFAULT_USER_COLOR = '#71717a';

export const USER_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#facc15', '#84cc16', '#10b981', '#14b8a6',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e',
];

export function isUserColor(color: string) {
  return color === DEFAULT_USER_COLOR || USER_COLORS.includes(color);
}
