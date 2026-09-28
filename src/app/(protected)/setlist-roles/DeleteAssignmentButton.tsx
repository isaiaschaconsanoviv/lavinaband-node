'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { deleteRoleAssignment } from '@/app/actions/role.actions';
import ConfirmModal from '@/components/ConfirmModal';

interface DeleteAssignmentButtonProps {
  assignmentId: string;
  description: string;
}

export default function DeleteAssignmentButton({ assignmentId, description }: DeleteAssignmentButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    setIsModalOpen(false);
    try {
      await deleteRoleAssignment(assignmentId);
      toast.success('Turno eliminado');
    } catch {
      toast.error('Hubo un error al eliminar el turno');
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={isDeleting}
        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
        title="Eliminar turno"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      <ConfirmModal
        isOpen={isModalOpen}
        title="Eliminar Turno"
        message={`¿Estás seguro de que deseas eliminar el turno de ${description}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDanger={true}
        onConfirm={handleDelete}
        onCancel={() => setIsModalOpen(false)}
      />
    </>
  );
}
