// Cookie con la vista elegida en el Rol de Set Lists ("Calendario" por defecto). La lee la
// página del Rol (servidor) para dibujar solo esa vista, sin parpadeo al recargar.
export const ROLE_VIEW_COOKIE = 'roleView';

export type RoleView = 'calendar' | 'cards';

export function parseRoleView(value: string | undefined): RoleView {
  return value === 'cards' ? 'cards' : 'calendar';
}

// Guarda la vista elegida (navegador)
export function saveRoleView(view: RoleView) {
  document.cookie = `${ROLE_VIEW_COOKIE}=${view}; path=/; max-age=31536000; samesite=lax`;
}
