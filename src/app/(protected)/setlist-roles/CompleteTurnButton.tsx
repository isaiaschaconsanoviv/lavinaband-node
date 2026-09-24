'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { completeRoleAssignment } from '@/app/actions/role.actions';
import ConfirmModal from '@/components/ConfirmModal';

interface CompleteTurnButtonProps {
  assignmentId: string;
}

export default function CompleteTurnButton({ assignmentId }: CompleteTurnButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleConfirm = async () => {
    setShowModal(false);
    setLoading(true);
    try {
      await completeRoleAssignment(assignmentId);
      toast.success('¡Set list marcado como completado!');
    } catch (error) {
      toast.error('Error al completar el turno');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        disabled={loading}
        className="w-full py-2 mt-4 text-sm font-semibold text-white bg-blue-600/90 hover:bg-blue-500 rounded-lg shadow-lg shadow-blue-900/20 transition-colors disabled:opacity-50"
      >
        {loading ? 'Notificando...' : 'Confirmar Set List'}
      </button>

      <ConfirmModal
        isOpen={showModal}
        title="Terminar Set List"
        message="¿Has terminado de armar los set lists de esta semana? Al confirmar, se notificará a toda la banda para que pasen a revisarlos."
        confirmText="Sí, notificar"
        cancelText="Todavía no"
        onConfirm={handleConfirm}
        onCancel={() => setShowModal(false)}
      />
    </>
  );
}
