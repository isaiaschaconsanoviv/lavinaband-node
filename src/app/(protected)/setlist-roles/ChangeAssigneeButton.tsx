'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { changeRoleAssignment, type RoleChangeScope } from '@/app/actions/role.actions';
import CustomSelect from '@/components/ui/CustomSelect';
import ModalPortal from '@/components/ui/ModalPortal';

interface ChangeAssigneeButtonProps {
  assignmentId: string;
  // Encargado actual de la semana y de cada día (el del día puede ser otro si se cambió por día)
  currentAssignees: Record<RoleChangeScope, string>;
  dayLabels: { sunday: string; thursday: string };
  approvedUsers: { _id: string; name: string }[];
}

export default function ChangeAssigneeButton({ assignmentId, currentAssignees, dayLabels, approvedUsers }: ChangeAssigneeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [scope, setScope] = useState<RoleChangeScope>('week');

  // Para un día se ofrece a todos menos a quien ya lo tiene (incluye al de la semana, para regresárselo)
  const availableUsers = approvedUsers.filter(u => u._id !== currentAssignees[scope]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const selected = availableUsers.some(u => u._id === selectedUserId) ? selectedUserId : availableUsers[0]?._id || '';

  const scopes: { value: RoleChangeScope; label: string }[] = [
    { value: 'week', label: 'Semana completa' },
    { value: 'sunday', label: `Solo ${dayLabels.sunday}` },
    { value: 'thursday', label: `Solo ${dayLabels.thursday}` },
  ];

  const handleChange = async () => {
    if (!selected) {
      toast.error('Selecciona un usuario válido');
      return;
    }

    setLoading(true);
    try {
      await changeRoleAssignment(assignmentId, selected, scope);
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
        onClick={() => { setScope('week'); setShowModal(true); }}
        className="w-full py-1.5 text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded transition-colors"
      >
        Cambiar Encargado
      </button>

      {showModal && (
        <ModalPortal>
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 pt-24 sm:pt-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          {/* Sin overflow-hidden: recortaría la lista desplegable del select */}
          <div className="bg-zinc-900 border border-zinc-700/50 rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-2">Cambiar Encargado</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                {scope === 'week'
                  ? 'Selecciona al nuevo encargado para esta semana. El turno volverá a estado Pendiente.'
                  : `Selecciona a quien armará solo el set list del ${scope === 'sunday' ? dayLabels.sunday : dayLabels.thursday}. El otro día no cambia.`}
              </p>

              <div className="grid grid-cols-3 gap-1 p-1 mb-4 bg-zinc-950/60 border border-zinc-800 rounded-xl">
                {scopes.map(s => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setScope(s.value)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${scope === s.value ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="mb-4">
                <CustomSelect
                  name="assigneeSelect"
                  options={availableUsers.map(u => ({ value: u._id, label: u.name }))}
                  value={selected}
                  onChange={(val) => setSelectedUserId(val)}
                />
              </div>
            </div>

            <div className="bg-zinc-950/50 p-4 border-t border-zinc-800/50 rounded-b-2xl flex justify-end gap-3">
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
        </ModalPortal>
      )}
    </>
  );
}
