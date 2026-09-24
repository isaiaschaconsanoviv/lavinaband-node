'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { toggleRoleRotation, generateMoreWeeks } from '@/app/actions/role.actions';

export default function RoleControls({ initialIsActive }: { initialIsActive: boolean }) {
  const [isActive, setIsActive] = useState(initialIsActive);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const result = await toggleRoleRotation();
      setIsActive(result.isActive);
      toast.success(result.isActive ? 'Rotación iniciada' : 'Rotación pausada');
    } catch (error) {
      toast.error('Error al cambiar el estado de rotación');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await generateMoreWeeks();
      toast.success('Semanas generadas exitosamente');
    } catch (error) {
      toast.error('Error al generar semanas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isActive && (
        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-600/30 rounded-lg font-medium text-xs transition-colors disabled:opacity-50"
        >
          Generar +
        </button>
      )}
      <button 
        onClick={handleToggle}
        disabled={loading}
        className={`px-4 py-2 text-white rounded-lg font-medium text-sm transition-colors shadow-lg disabled:opacity-50 ${
          isActive 
            ? 'bg-yellow-600 hover:bg-yellow-500 shadow-yellow-600/20' 
            : 'bg-green-600 hover:bg-green-500 shadow-green-600/20'
        }`}
      >
        {loading ? '...' : isActive ? 'Pausar Rotación' : 'Iniciar Rotación'}
      </button>
    </div>
  );
}
