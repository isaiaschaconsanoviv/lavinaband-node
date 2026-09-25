"use client";

import { useState } from "react";
import { deleteUser } from "@/app/actions/user.actions";

export default function DeleteUserButton({ userId, userName }: { userId: string, userName: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente a la cuenta de ${userName}? Esta acción no se puede deshacer.`)) {
      setIsDeleting(true);
      try {
        await deleteUser(userId);
      } catch (error: any) {
        alert(error.message || "Hubo un error al intentar eliminar al usuario.");
        setIsDeleting(false);
      }
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
      title="Eliminar usuario"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  );
}
