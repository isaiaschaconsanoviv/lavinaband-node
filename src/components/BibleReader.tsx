'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import CustomSelect from './ui/CustomSelect';

const VERSIONS = [
  { id: 'NTV', name: 'Nueva Traducción Viviente (NTV)' },
  { id: 'RVR1960', name: 'Reina-Valera 1960 (RV60)' },
  { id: 'NVI', name: 'Nueva Versión Internacional (NVI)' },
  { id: 'PDT', name: 'Palabra de Dios para Todos (PDT)' },
];

export default function BibleReader({ chapter, onClose }: { chapter: string, onClose: () => void }) {
  const [version, setVersion] = useState('NTV');
  const [data, setData] = useState<{ title: string, html: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchChapter = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/bible?search=${encodeURIComponent(chapter)}&version=${version}&t=${Date.now()}`, { cache: 'no-store' });
        const result = await res.json();
        
        if (result.success) {
          if (isMounted) setData(result.data);
        } else {
          if (isMounted) setError(result.error || 'Error al obtener la lectura');
        }
      } catch (err: any) {
        if (isMounted) setError('Error de conexión');
      }
      if (isMounted) setLoading(false);
    };

    fetchChapter();
    return () => { isMounted = false; };
  }, [chapter, version]);

  const [isMountedState, setIsMountedState] = useState(false);
  useEffect(() => { setIsMountedState(true); }, []);

  if (!isMountedState) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm p-4 sm:p-6 flex justify-center items-start">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col mt-4 sm:mt-10 mb-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-zinc-800 flex flex-wrap gap-4 items-center justify-between bg-zinc-900 sticky top-0 z-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <h2 className="text-xl font-bold text-white">
              {data?.title || chapter}
            </h2>
            <div className="w-56 sm:w-64">
              <CustomSelect
                name="version"
                defaultValue={version}
                onChange={(val) => setVersion(val)}
                options={VERSIONS.map(v => ({ value: v.id, label: v.name }))}
              />
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 bg-zinc-950/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 space-y-4">
              <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
              <p className="text-zinc-400 text-sm animate-pulse">Buscando en la Biblia...</p>
            </div>
          ) : error ? (
            <div className="text-center text-red-400 p-8 bg-red-500/10 rounded-xl border border-red-500/20">
              <p>No pudimos encontrar "{chapter}".</p>
              <p className="text-xs mt-2 opacity-70">{error}</p>
            </div>
          ) : data ? (
            <div 
              className="prose prose-invert prose-emerald max-w-none text-zinc-300 leading-relaxed font-serif text-lg
                [&>p]:mb-4 [&>p>sup]:text-emerald-500 [&>p>sup]:font-bold [&>p>sup]:mr-1 [&>p>sup]:text-xs
                [&_h3]:text-2xl [&_h3]:font-bold [&_h3]:text-emerald-400 [&_h3]:mt-8 [&_h3]:mb-4
                [&_h4]:text-xl [&_h4]:font-semibold [&_h4]:text-emerald-400/80 [&_h4]:mt-6 [&_h4]:mb-3
                [&_.chapternum]:text-5xl [&_.chapternum]:font-bold [&_.chapternum]:text-emerald-500 [&_.chapternum]:float-left [&_.chapternum]:mr-3 [&_.chapternum]:mt-1 [&_.chapternum]:leading-none"
              dangerouslySetInnerHTML={{ __html: data.html }} 
            />
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}