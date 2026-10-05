'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { DEFAULT_USER_COLOR, USER_COLORS } from '@/lib/userColors';

// Sección "Mi color" del perfil. Los colores que ya eligió otra persona se ven tenues
// y al tocarlos se avisa de quién son.
export default function ColorForm({ initialColor, takenBy }: { initialColor: string, takenBy: Record<string, string> }) {
  const [color, setColor] = useState(initialColor);
  const [savedColor, setSavedColor] = useState(initialColor);
  const [taken, setTaken] = useState(takenBy);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleColor: color })
      });
      const data = await res.json();
      if (res.ok) {
        setSavedColor(color);
        toast.success('Color actualizado correctamente');
      } else {
        // Alguien más lo eligió mientras tanto
        if (data.takenBy) setTaken(prev => ({ ...prev, [color]: data.takenBy }));
        toast.error(data.error || 'Error al actualizar el color');
      }
    } catch {
      toast.error('Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const swatch = (c: string) => {
    const owner = c !== color ? taken[c] : undefined;
    return (
      <button
        key={c}
        type="button"
        onClick={() => owner ? toast.error(`Ese color ya es de ${owner}`) : setColor(c)}
        title={owner ? `Lo eligió ${owner}` : c === DEFAULT_USER_COLOR ? 'Sin color' : undefined}
        className={`relative w-8 h-8 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-white' : owner ? 'opacity-25' : 'hover:scale-110'}`}
        style={{ backgroundColor: c }}
      >
        {owner && <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">✕</span>}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-zinc-400">
        Te identifica en la app: en el Rol, en In-Ears y en quién canta cada canción de los set lists. Cada color solo puede tenerlo una persona.
      </p>
      <div className="flex gap-2 flex-wrap">
        {USER_COLORS.map(swatch)}
        {swatch(DEFAULT_USER_COLOR)}
      </div>
      <button
        type="button"
        onClick={handleSave}
        disabled={loading || color === savedColor}
        className="w-full mt-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? 'Guardando...' : 'Guardar color'}
      </button>
    </div>
  );
}
