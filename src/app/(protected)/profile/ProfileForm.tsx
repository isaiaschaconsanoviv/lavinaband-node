'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

export default function ProfileForm({ 
  initialName, 
  initialEmail, 
  initialRoleColor 
}: { 
  initialName: string, 
  initialEmail: string,
  initialRoleColor: string
}) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [roleColor, setRoleColor] = useState(initialRoleColor);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { update } = useSession();

  const predefinedColors = [
    '#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e', '#71717a'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, currentPassword, newPassword, roleColor })
      });

      const data = await res.json();
      if (res.ok) {
        await update({ name });
        toast.success('Perfil actualizado correctamente');
        setCurrentPassword('');
        setNewPassword('');
      } else {
        toast.error(data.error || 'Error al actualizar perfil');
      }
    } catch (err) {
      toast.error('Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-300">Nombre Completo</label>
        <input 
          type="text" 
          value={name} 
          onChange={e => setName(e.target.value)}
          required
          className="mt-1 block w-full px-4 py-2 bg-zinc-950/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300">Correo Electrónico</label>
        <input 
          type="email" 
          value={email} 
          onChange={e => setEmail(e.target.value)}
          required
          className="mt-1 block w-full px-4 py-2 bg-zinc-950/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">Color de Rol</label>
        <div className="flex gap-2 flex-wrap">
          {predefinedColors.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => setRoleColor(color)}
              className={`w-8 h-8 rounded-full transition-transform ${roleColor === color ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <hr className="border-zinc-800 my-4" />
      <h4 className="text-sm font-semibold text-zinc-400">Cambiar Contraseña (Opcional)</h4>

      <div>
        <label className="block text-sm font-medium text-zinc-300">Contraseña Actual</label>
        <input 
          type="password" 
          value={currentPassword} 
          onChange={e => setCurrentPassword(e.target.value)}
          className="mt-1 block w-full px-4 py-2 bg-zinc-950/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-blue-500"
          placeholder="Requerido si cambiarás la contraseña"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300">Nueva Contraseña</label>
        <input 
          type="password" 
          value={newPassword} 
          onChange={e => setNewPassword(e.target.value)}
          className="mt-1 block w-full px-4 py-2 bg-zinc-950/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-blue-500"
          placeholder="Dejar en blanco si no deseas cambiarla"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? 'Guardando...' : 'Guardar Cambios'}
      </button>
    </form>
  );
}

