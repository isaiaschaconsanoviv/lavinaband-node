'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { confirmRoleAssignment } from '@/app/actions/role.actions';
import ConfirmModal from '@/components/ConfirmModal';

interface ConfirmTurnButtonProps {
  assignmentId: string;
}

export default function ConfirmTurnButton({ assignmentId }: ConfirmTurnButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleConfirm = async () => {
    setShowModal(false);
    setLoading(true);
    try {
      await confirmRoleAssignment(assignmentId);
      toast.success('Turno confirmado exitosamente');
    } catch (error) {
      toast.error('Error al confirmar el turno');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        disabled={loading}
        className="w-full py-2 mt-4 text-sm font-semibold text-white bg-green-600/90 hover:bg-green-500 rounded-lg shadow-lg shadow-green-900/20 transition-colors disabled:opacity-50"
      >
        {loading ? 'Confirmando...' : 'Confirmar de Enterado'}
      </button>

      <ConfirmModal
        isOpen={showModal}
        title="Confirmar Turno"
        message="¿Estás seguro de que deseas confirmar tu turno para armar los Set Lists de esta semana?"
        confirmText="Confirmar"
        cancelText="Cancelar"
        onConfirm={handleConfirm}
        onCancel={() => setShowModal(false)}
      />
    </>
  );
}
