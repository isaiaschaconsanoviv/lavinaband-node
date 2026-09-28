'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import InEarFlagsFields, { type InEarFlags } from '@/components/inEars/InEarFlagsFields';

// Sección "In-Ears" del perfil: cada quien marca si canta, qué toca y si es ingeniero
export default function InEarForm({ initialFlags }: { initialFlags: InEarFlags }) {
  const [flags, setFlags] = useState(initialFlags);
  const [savedFlags, setSavedFlags] = useState(initialFlags);
  const [loading, setLoading] = useState(false);

  const hasChanges = JSON.stringify(flags) !== JSON.stringify(savedFlags);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flags)
      });
      const data = await res.json();
      if (res.ok) {
        setSavedFlags(flags);
        toast.success('In-Ears actualizado correctamente');
      } else {
        toast.error(data.error || 'Error al actualizar');
      }
    } catch {
      toast.error('Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <InEarFlagsFields value={flags} onChange={setFlags} disabled={loading} />
      <button
        type="button"
        onClick={handleSave}
        disabled={loading || !hasChanges}
        className="w-full mt-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? 'Guardando...' : 'Guardar In-Ears'}
      </button>
    </div>
  );
}
