'use client';
import { useState } from 'react';
import BibleReader from './BibleReader';

export default function WeeklyReadingCard({ initialReading, role }: { initialReading: string, role: string }) {
  const [reading, setReading] = useState(initialReading);
  const [isEditing, setIsEditing] = useState(false);
  const [tempReading, setTempReading] = useState(initialReading);
  const [loading, setLoading] = useState(false);
  const [showReader, setShowReader] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'weeklyReading', value: tempReading })
    });
    if (res.ok) {
      setReading(tempReading);
      setIsEditing(false);
    } else {
      alert('Error al guardar la lectura');
    }
    setLoading(false);
  };

  return (
    <div className="bg-zinc-900/60 backdrop-blur border border-zinc-700/50 rounded-xl p-6 shadow-lg flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-emerald-400">Lectura Semanal</h3>
          {role === 'ADMIN' && !isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="text-xs text-zinc-400 hover:text-emerald-400 font-medium transition-colors"
            >
              Editar
            </button>
          )}
        </div>
        
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded p-3 text-white text-sm focus:outline-none focus:border-emerald-500 min-h-[80px]"
              value={tempReading}
              onChange={(e) => setTempReading(e.target.value)}
              placeholder="Ej: Salmos 23"
              disabled={loading}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button 
                onClick={() => { setIsEditing(false); setTempReading(reading); }}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                disabled={loading}
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            {reading ? (
              <div>
                <p className="text-2xl font-bold text-white whitespace-pre-wrap">{reading}</p>
                <button 
                  onClick={() => setShowReader(true)}
                  className="mt-4 inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  Leer Capítulo
                </button>
              </div>
            ) : (
              <p className="text-zinc-300 text-sm">No hay lectura asignada por el momento.</p>
            )}
          </div>
        )}
      </div>
      {showReader && reading && <BibleReader chapter={reading} onClose={() => setShowReader(false)} />}
    </div>
  );
}