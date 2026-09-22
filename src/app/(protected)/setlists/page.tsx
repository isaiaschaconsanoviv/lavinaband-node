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


  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Set Lists</h1>
          <p className="text-zinc-400 mt-1">Administra los set lists para ensayos y eventos</p>
        </div>
        
        <button onClick={createSetlist} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg min-w-max font-medium transition-all shadow-lg">
          + Crear Set List
        </button>
      </header>

      {loading ? (
        <div className="text-center p-8 text-zinc-400">Cargando...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {setlists.length === 0 ? (
            <div className="col-span-full bg-zinc-900/60 p-8 rounded-xl border border-zinc-700/50 text-center text-zinc-400">
              Aún no hay set lists creados.
            </div>
          ) : (
            setlists.map((setlist: any) => (
              <Link key={setlist._id} href={`/setlists/${setlist._id}`} className="bg-zinc-900/40 p-6 rounded-xl border border-zinc-700/50 hover:bg-zinc-800/60 transition-colors group block">
                <h3 className="text-xl font-semibold group-hover:text-blue-400 transition-colors">{setlist.title}</h3>
                <p className="text-zinc-400 mt-2">
                  {format(new Date(setlist.date), "EEEE, d 'de' MMMM yyyy", { locale: es })}
                </p>
                <div className="mt-4 flex justify-between items-center text-sm text-zinc-500">
                  <span><strong>{setlist.songs?.length || 0}</strong> canciones</span>
                  <span><strong>{setlist.attendance?.length || 0}</strong> confirmados</span>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}