'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

type SetListRoleStatus = 'NONE' | 'PENDING' | 'APPROVED';

export default function RoleForm({
  initialSetListRoleStatus = 'NONE'
}: {
  initialSetListRoleStatus?: SetListRoleStatus
}) {
  const [setListRoleStatus, setSetListRoleStatus] = useState<SetListRoleStatus>(initialSetListRoleStatus);
  // Último estado guardado, para saber si se solicita unirse o salir del rol
  const [savedStatus, setSavedStatus] = useState<SetListRoleStatus>(initialSetListRoleStatus);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const requestSetListRole = setListRoleStatus === 'PENDING' && savedStatus === 'NONE';
    const optOutSetListRole = setListRoleStatus === 'NONE' && (savedStatus === 'APPROVED' || savedStatus === 'PENDING');

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestSetListRole, optOutSetListRole })
      });

      const data = await res.json();
      if (res.ok) {
        setSavedStatus(setListRoleStatus);
        toast.success('Rol actualizado correctamente');
      } else {
        toast.error(data.error || 'Error al actualizar el rol');
      }
    } catch {
      toast.error('Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-start gap-3 p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
        <div className="flex items-center h-5 mt-1">
          <input
            id="role-checkbox"
            type="checkbox"
            checked={setListRoleStatus !== 'NONE'}
            onChange={(e) => {
              if (e.target.checked) {
                setSetListRoleStatus(savedStatus === 'NONE' ? 'PENDING' : savedStatus);
              } else {
                setSetListRoleStatus('NONE');
              }
            }}
            disabled={savedStatus === 'PENDING' && setListRoleStatus === 'PENDING'}
            className="w-5 h-5 rounded border-zinc-600 text-blue-500 focus:ring-blue-500/20 focus:ring-offset-zinc-900 bg-zinc-900"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="role-checkbox" className="text-sm font-medium text-zinc-200 cursor-pointer">
            Quiero participar en el Rol de Set Lists
          </label>
          <p className="text-xs text-zinc-400 mt-1">
            Al activar esta opción, solicitarás a los administradores integrarte a la rotación semanal para armar los set lists.
          </p>
          {setListRoleStatus === 'PENDING' && (
            <span className="inline-block mt-2 text-xs font-semibold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-md w-fit">
              Solicitud pendiente de aprobación
            </span>
          )}
          {setListRoleStatus === 'APPROVED' && (
            <span className="inline-block mt-2 text-xs font-semibold text-green-500 bg-green-500/10 px-2 py-1 rounded-md w-fit">
              Eres miembro activo del rol
            </span>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? 'Guardando...' : 'Guardar Rol'}
      </button>
    </form>
  );
}
