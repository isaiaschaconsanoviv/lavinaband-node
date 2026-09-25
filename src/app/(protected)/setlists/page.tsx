'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format, nextSunday } from 'date-fns';
import { es } from 'date-fns/locale';

export default function SetlistsPage() {
  const [setlists, setSetlists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/setlists')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setSetlists(data.data);
        setLoading(false);
      });
  }, []);

  const createSetlist = async () => {
    const nextSundayDate = nextSunday(new Date());
    const defaultTitleStr = format(nextSundayDate, "EEEE d 'de' MMMM, yyyy", { locale: es });
    const capitalizedTitle = defaultTitleStr.charAt(0).toUpperCase() + defaultTitleStr.slice(1);

    const res = await fetch('/api/setlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: capitalizedTitle,
        date: nextSundayDate,
        songs: []
      })
    });
    const data = await res.json();
    if (data.success) {
      window.location.href = `/setlists/${data.data._id}`;
    }
  };

  // Filter setlists
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingSetlists = setlists.filter((s: any) => new Date(s.date) >= today);
  // Sort archived to show the most recent first
  const archivedSetlists = setlists.filter((s: any) => new Date(s.date) < today).reverse();

  const [showArchived, setShowArchived] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Set Lists</h1>
          <p className="text-zinc-400 mt-1">Administra los set lists para ensayos y eventos</p>
        </div>
        
        <button onClick={createSetlist} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg min-w-max font-medium transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Crear Set List
        </button>
      </header>

      {loading ? (
        <div className="text-center p-8 text-zinc-400">Cargando...</div>
      ) : (
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Próximos Eventos
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingSetlists.length === 0 ? (
                <div className="col-span-full bg-zinc-900/60 p-8 rounded-xl border border-zinc-700/50 text-center text-zinc-400">
                  No hay próximos set lists programados.
                </div>
              ) : (
                upcomingSetlists.map((setlist: any) => (
                  <Link key={setlist._id} href={`/setlists/${setlist._id}`} className="bg-zinc-900/40 p-6 rounded-xl border border-zinc-700/50 hover:bg-zinc-800/60 hover:border-blue-500/50 transition-colors group block shadow-lg">
                    <h3 className="text-xl font-semibold text-zinc-100 group-hover:text-blue-400 transition-colors">{setlist.title}</h3>
                    <p className="text-zinc-400 mt-2 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {format(new Date(setlist.date), "EEEE, d 'de' MMMM yyyy", { locale: es })}
                    </p>
                    <div className="mt-4 flex justify-between items-center text-sm text-zinc-500 bg-zinc-950/50 rounded-lg p-2.5">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                        <strong>{setlist.songs?.length || 0}</strong> canciones
                      </span>
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        <strong>{setlist.attendance?.length || 0}</strong> confirmados
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {archivedSetlists.length > 0 && (
            <div className="pt-6 border-t border-zinc-800/50">
              <button 
                onClick={() => setShowArchived(!showArchived)}
                className="w-full flex items-center justify-between p-4 bg-zinc-900/30 hover:bg-zinc-800/50 border border-zinc-800 rounded-xl transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-zinc-300">Archivo Histórico</h3>
                    <p className="text-sm text-zinc-500">{archivedSetlists.length} set lists anteriores</p>
                  </div>
                </div>
                <svg className={`w-5 h-5 text-zinc-500 transition-transform ${showArchived ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>

              {showArchived && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4 animate-in slide-in-from-top-4 fade-in duration-300">
                  {archivedSetlists.map((setlist: any) => (
                    <Link key={setlist._id} href={`/setlists/${setlist._id}`} className="bg-zinc-900/20 p-5 rounded-xl border border-zinc-800 hover:bg-zinc-800/40 transition-colors group block opacity-80 hover:opacity-100">
                      <h3 className="text-lg font-medium text-zinc-300 group-hover:text-white transition-colors line-clamp-1">{setlist.title}</h3>
                      <p className="text-sm text-zinc-500 mt-1">
                        {format(new Date(setlist.date), "EEEE, d 'de' MMMM yyyy", { locale: es })}
                      </p>
                      <div className="mt-3 flex gap-4 text-xs text-zinc-600">
                        <span>{setlist.songs?.length || 0} canciones</span>
                        <span>{setlist.attendance?.length || 0} asistencias</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}