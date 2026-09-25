'use client';

import { signOut } from 'next-auth/react';

export default function MobileLogoutButton() {
  return (
    <div className="md:hidden mt-8">
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: '/auth/login' })}
        className="w-full flex items-center justify-center px-4 py-4 text-red-400 bg-red-400/10 hover:bg-red-400/20 rounded-xl transition-colors font-medium border border-red-500/20 shadow-lg shadow-red-900/20"
      >
        <span className="mr-2 text-lg">🚪</span>
        Cerrar sesión
      </button>
    </div>
  );
}
