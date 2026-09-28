import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

// Los invitados (GUEST) solo pueden ver su perfil y el listado de canciones
export const GUEST_HOME = '/songs';

// Para páginas: redirige a los invitados a la única sección que pueden ver
export async function redirectGuests() {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string } | undefined)?.role === 'GUEST') redirect(GUEST_HOME);
}

// Para rutas API: devuelve la respuesta de error si no hay sesión o si es invitado
export async function rejectGuests() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if ((session.user as { role?: string })?.role === 'GUEST') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }
  return null;
}
