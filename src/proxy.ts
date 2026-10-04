import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Si no hay sesión, manda al login recordando la página pedida (por ejemplo, la
// de una notificación) para regresar ahí después de iniciar sesión. Es solo una
// verificación rápida: el layout protegido sigue validando la sesión.
export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (token) return NextResponse.next();

  const loginUrl = new URL('/auth/login', request.url);
  loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/songs/:path*',
    '/setlists/:path*',
    '/setlist-roles/:path*',
    '/anuncios/:path*',
    '/in-ears/:path*',
    '/profile/:path*',
    '/users/:path*',
  ],
};
