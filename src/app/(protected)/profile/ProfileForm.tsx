'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

const inputClassName = "mt-1 block w-full px-4 py-2 bg-zinc-950/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed";

export default function ProfileForm({
  initialName,
  initialEmail
}: {
  initialName: string,
  initialEmail: string
}) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  // Últimos valores guardados, para restaurarlos al cancelar la edición
  const [savedName, setSavedName] = useState(initialName);
  const [savedEmail, setSavedEmail] = useState(initialEmail);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { update } = useSession();

  const handleCancel = () => {
    setName(savedName);
    setEmail(savedEmail);
    setCurrentPassword('');
    setNewPassword('');
    setIsEditing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, currentPassword, newPassword })
      });

      const data = await res.json();
      if (res.ok) {
        await update({ name });
        toast.success('Perfil actualizado correctamente');
        setSavedName(name);
        setSavedEmail(email);
        setCurrentPassword('');
        setNewPassword('');
        setIsEditing(false);
      } else {
        toast.error(data.error || 'Error al actualizar perfil');
      }
    } catch {
      toast.error('Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-300">Nombre para mostrar</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          disabled={!isEditing}
          className={inputClassName}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300">Correo Electr&oacute;nico</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          disabled={!isEditing}
          className={inputClassName}
        />
      </div>

      <hr className="border-zinc-800 my-4" />
      <h4 className="text-sm font-semibold text-zinc-400">Cambiar Contrase&ntilde;a (Opcional)</h4>

      <div>
        <label className="block text-sm font-medium text-zinc-300">Contrase&ntilde;a Actual</label>
        <input
          type="password"
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          disabled={!isEditing}
          className={inputClassName}
          placeholder="Requerido si cambiarás la contraseña"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300">Nueva Contrase&ntilde;a</label>
        <input
          type="password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          disabled={!isEditing}
          className={inputClassName}
          placeholder="Dejar en blanco si no deseas cambiarla"
        />
      </div>

      {isEditing ? (
        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="w-full mt-4 px-4 py-2 border border-zinc-700 hover:border-blue-500/60 text-zinc-300 hover:text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          Editar datos
        </button>
      )}
    </form>
  );
}
