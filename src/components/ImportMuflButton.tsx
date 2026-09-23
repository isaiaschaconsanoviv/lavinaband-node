'use client';
import { useState, useRef } from 'react';
import { importHolyricsMufl } from '@/app/actions/import.actions';
import toast from 'react-hot-toast';

export default function ImportMuflButton() {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const result = await importHolyricsMufl(formData);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Error al importar el archivo.');
    } finally {
      setLoading(false);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input 
        type="file" 
        accept=".mufl" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange}
      />
      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="px-4 py-2 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-200 rounded-lg font-medium transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
      >
        {loading ? (
           <span className="animate-spin inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full"></span>
        ) : (
           <span>📁</span>
        )}
        {loading ? 'Importando...' : 'Importar .mufl'}
      </button>
    </>
  );
}
