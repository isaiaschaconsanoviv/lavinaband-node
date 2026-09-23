'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

export default function Sidebar({ userRole, userName }: { userRole?: string; userName: string }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Inicio', path: '/dashboard', icon: '🏠' },
    { name: 'Canciones', path: '/songs', icon: '🎵' },
    { name: 'Set Lists', path: '/setlists', icon: '📋' },
    { name: 'Perfil', path: '/profile', icon: '👤' },
  ];

  if (userRole === 'ADMIN') {
    navItems.push({ name: 'Usuarios', path: '/users', icon: '👥' });
  }

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 bg-zinc-950/80 backdrop-blur-md border-r border-zinc-700 flex-col justify-between h-screen sticky top-0">
        <div>
          <div className="p-6">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="La Viña Band Logo" className="w-10 h-10 object-contain drop-shadow-md" />
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                La Viña Band
              </h1>
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

        <div className="p-4 border-t border-zinc-700">
          <button
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
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
            La Viña
          </h1>
        </div>
        <button onClick={() => signOut({ callbackUrl: '/auth/login' })} className="text-xs font-medium text-red-400 bg-red-400/10 px-3 py-1.5 rounded-full">
          Salir
        </button>
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-lg z-40">
        <ul className="flex justify-around items-center p-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.path);
            return (
              <li key={item.path} className="flex-1">
                <Link
                  href={item.path}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                    isActive
                      ? 'text-blue-400 scale-105'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <span className={`text-xl mb-1 ${isActive ? 'drop-shadow-md' : 'opacity-70'}`}>{item.icon}</span>
                  <span className="text-[10px] font-medium">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
