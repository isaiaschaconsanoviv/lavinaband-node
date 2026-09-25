'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { changeRoleAssignment } from '@/app/actions/role.actions';
import CustomSelect from '@/components/ui/CustomSelect';

interface ChangeAssigneeButtonProps {
  assignmentId: string;
  currentAssigneeId: string;
  approvedUsers: { _id: string; name: string }[];
}

export default function ChangeAssigneeButton({ assignmentId, currentAssigneeId, approvedUsers }: ChangeAssigneeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const availableUsers = approvedUsers.filter(u => u._id !== currentAssigneeId);
  const [selectedUserId, setSelectedUserId] = useState(availableUsers[0]?._id || '');

  const handleChange = async () => {
    if (!selectedUserId) {
      toast.error('Selecciona un usuario válido');
      return;
    }
    
    setLoading(true);
    try {
      await changeRoleAssignment(assignmentId, selectedUserId);
      toast.success('Encargado cambiado exitosamente');
      setShowModal(false);
    } catch (error) {
      toast.error('Error al cambiar de encargado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        className="w-full py-1.5 text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded transition-colors"
      >
        Cambiar Encargado
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 pt-24 sm:pt-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-700/50 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-2">Cambiar Encargado</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-4">Selecciona al nuevo encargado para esta semana. El turno volverá a estado Pendiente.</p>
              
              <div className="mb-4">
                <CustomSelect
                  name="assigneeSelect"
                  options={availableUsers.map(u => ({ value: u._id, label: u.name }))}
                  defaultValue={selectedUserId}
                  onChange={(val) => setSelectedUserId(val)}
                />
              </div>
            </div>
            
            <div className="bg-zinc-950/50 p-4 border-t border-zinc-800/50 flex justify-end gap-3">
              <button 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleChange}
                disabled={loading}
                className="bg-blue-600/90 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar Cambio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


