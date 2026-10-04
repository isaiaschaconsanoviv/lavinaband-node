'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { SIDEBAR_COOKIE } from '@/lib/sidebar';
import { signOutAndUnlinkPush } from '@/lib/pushClient';

export default function Sidebar({ userRole, userName, initialCollapsed = false }: { userRole?: string; userName: string; initialCollapsed?: boolean }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const toggleCollapsed = (value: boolean) => {
    setCollapsed(value);
    document.cookie = `${SIDEBAR_COOKIE}=${value ? '1' : '0'}; path=/; max-age=31536000; samesite=lax`;
  };

  const allNavItems = [
    { name: 'Inicio', path: '/dashboard', icon: '🏠' },
    { name: 'Canciones', path: '/songs', icon: '🎵' },
    { name: 'Set Lists', path: '/setlists', icon: '📋' },
    { name: 'Rol', path: '/setlist-roles', icon: '📅' },
    { name: 'In-Ears', path: '/in-ears', icon: '🎧' },
    { name: 'Perfil', path: '/profile', icon: '👤' },
  ];

  // Los invitados solo pueden ver el listado de canciones y su perfil
  const navItems = userRole === 'GUEST'
    ? allNavItems.filter(item => item.path === '/songs' || item.path === '/profile')
    : allNavItems;

  if (userRole === 'ADMIN') {
    navItems.push({ name: 'Usuarios', path: '/users', icon: '👥' });
  }

  return (
    <>
      {/* DESKTOP: con el menú oculto queda una franja angosta con el botón para mostrarlo */}
      {collapsed && (
        <div className="hidden md:flex w-14 shrink-0 flex-col items-center pt-6 border-r border-zinc-800 bg-zinc-950/80 h-screen sticky top-0">
          <button
            onClick={() => toggleCollapsed(false)}
            className="flex items-center justify-center w-10 h-10 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Mostrar menú"
            aria-label="Mostrar menú"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className={`${collapsed ? 'hidden' : 'hidden md:flex'} w-64 shrink-0 bg-zinc-950/80 backdrop-blur-md border-r border-zinc-700 flex-col justify-between h-screen sticky top-0`}>
        {/* Si la pantalla es baja, esta parte se desplaza y "Cerrar Sesión" queda fijo abajo */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pb-4">
          <div className="p-6">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="La Viña Band Logo" className="w-10 h-10 object-contain drop-shadow-md" />
              <h1 className="flex-1 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                La Viña Band
              </h1>
              <button
                onClick={() => toggleCollapsed(true)}
                className="-mr-2 p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                title="Ocultar menú"
                aria-label="Ocultar menú"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
              </button>
            </div>
            <p className="text-sm text-zinc-400 mt-1">Hola, {userName}</p>
            <span className="inline-block px-2 py-1 mt-2 text-xs font-semibold rounded-full bg-zinc-700 text-zinc-300">
              {userRole}
            </span>
          </div>

          <nav className="mt-6">
            <ul className="space-y-2 px-4">
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.path);
                return (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-400 border border-blue-500/30'
                          : 'text-zinc-300 hover:bg-zinc-700/50 hover:text-white'
                      }`}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="p-4 border-t border-zinc-700 shrink-0">
          <button
            onClick={signOutAndUnlinkPush}
            className="w-full flex items-center px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
          >
            <span className="mr-3">🚪</span>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* MOBILE TOP BAR */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            La Viña Band
          </h1>
        </div>
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-lg z-40">
        <ul className="flex justify-around items-center p-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.path);
            return (
              <li key={item.path} className="flex-1 min-w-0">
                <Link
                  href={item.path}
                  className={`flex flex-col items-center justify-center text-center px-0.5 py-2 rounded-xl transition-all ${
                    isActive
                      ? 'text-blue-400 scale-105'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <span className={`text-xl mb-1 ${isActive ? 'drop-shadow-md' : 'opacity-70'}`}>{item.icon}</span>
                  <span className="text-[10px] font-medium leading-tight text-center">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

