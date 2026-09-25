import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { importMuflForSong } from '@/app/actions/import.actions';

export default function SuggestionsModal({ isOpen, onClose, onApprove }: { isOpen: boolean; onClose: () => void; onApprove: () => void }) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // File upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSongId, setActiveSongId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/songs/suggestions')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setSuggestions(data.data);
          }
          setLoading(false);
        })
        .catch(() => {
          toast.error('Error al cargar sugerencias');
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/songs/suggestions/${id}`, { method: 'PUT' });
      const data = await res.json();
      if (data.success) {
        toast.success('Canción aprobada (sin letra ni tono)');
        setSuggestions(suggestions.filter(s => s._id !== id));
        onApprove();
      } else {
        toast.error('Error al aprobar');
      }
    } catch {
      toast.error('Error de conexión');
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('¿Estás seguro de rechazar y eliminar esta sugerencia?')) return;
    try {
      const res = await fetch(`/api/songs/suggestions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Sugerencia rechazada');
        setSuggestions(suggestions.filter(s => s._id !== id));
      } else {
        toast.error('Error al rechazar');
      }
    } catch {
      toast.error('Error de conexión');
    }
  };

  const triggerFileUpload = (id: string) => {
    setActiveSongId(id);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeSongId) return;

    setIsUploading(true);
    const toastId = toast.loading('Importando y aprobando...');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const result = await importMuflForSong(activeSongId, formData);
      if (result.success) {
        toast.success(result.message, { id: toastId });
        setSuggestions(suggestions.filter(s => s._id !== activeSongId));
        onApprove();
      } else {
        toast.error(result.message, { id: toastId });
      }
    } catch (err) {
      toast.error('Error al subir el archivo', { id: toastId });
    } finally {
      setIsUploading(false);
      setActiveSongId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 sticky top-0 z-10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>💡</span> Sugerencias Pendientes
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <input 
            type="file" 
            accept=".mufl" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange}
          />
          
          {loading ? (
            <div className="text-center text-zinc-400 py-8">Cargando sugerencias...</div>
          ) : suggestions.length === 0 ? (
            <div className="text-center text-zinc-500 py-12 flex flex-col items-center gap-3">
              <svg className="w-12 h-12 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p>No hay sugerencias pendientes.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((song) => (
                <div key={song._id} className="bg-zinc-800/40 border border-zinc-700/50 rounded-xl p-5 flex flex-col justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-blue-400">{song.title}</h3>
                    <p className="text-zinc-300 font-medium">{song.artist}</p>
                    <div className="text-sm text-zinc-500 mt-2 space-y-1">
                      <p>Sugerido por: <span className="text-zinc-300 font-medium">{song.suggestedBy?.name || 'Desconocido'}</span></p>
                      {song.youtubeLink && (
                        <p>
                          <a href={song.youtubeLink} target="_blank" rel="noreferrer" className="text-red-400 hover:underline flex items-center gap-1 w-fit">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.501 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.377.55 9.377.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                            Ver en YouTube
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end sm:justify-start border-t border-zinc-700/50 pt-3 mt-1">
                    <button 
                      onClick={() => triggerFileUpload(song._id)}
                      disabled={isUploading}
                      className="px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white rounded-lg transition-colors font-medium flex-1 sm:flex-none text-center flex items-center justify-center gap-2"
                    >
                      <span>📁</span> Aprobar con .mufl
                    </button>
                    <button 
                      onClick={() => handleApprove(song._id)}
                      disabled={isUploading}
                      className="px-4 py-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors font-medium flex-1 sm:flex-none text-center"
                    >
                      Aprobar vacía
                    </button>
                    <button 
                      onClick={() => handleReject(song._id)}
                      disabled={isUploading}
                      className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600 hover:text-white rounded-lg transition-colors font-medium flex-1 sm:flex-none text-center"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
