"use client";

import React, { useState } from 'react';
import { updateUserRole } from "@/app/actions/user.actions";
import CustomSelect from '@/components/ui/CustomSelect';
import DeleteUserButton from "./DeleteUserButton";

export default function UsersTable({ users, currentUserId }: { users: any[], currentUserId: string }) {
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, formData: FormData) => {
    const newRole = formData.get('role') as string;
    await updateUserRole(userId, newRole);
  };

  return (
    <div className="bg-zinc-900/40 rounded-xl border border-zinc-700/50 overflow-visible">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-zinc-900/90 text-zinc-300 text-sm uppercase tracking-wider [&>th:first-child]:rounded-tl-xl [&>th:last-child]:rounded-tr-xl">
            <th className="table-cell md:hidden p-4 w-10"></th>
            <th className="p-4 font-semibold">Nombre</th>
            <th className="hidden md:table-cell p-4 font-semibold">Correo</th>
            <th className="hidden md:table-cell p-4 font-semibold">Rol Actual</th>
            <th className="hidden md:table-cell p-4 font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-700/50">
          {users.map((user: any) => (
            <React.Fragment key={user._id}>
              <tr 
                className={`hover:bg-zinc-800/30 transition-colors ${expandedUserId === user._id ? 'bg-zinc-800/20' : ''}`}
                onClick={() => {
                  if (window.innerWidth < 768) {
                    setExpandedUserId(expandedUserId === user._id ? null : user._id);
                  }
                }}
              >
                <td className="table-cell md:hidden p-4 text-center cursor-pointer">
                  <button className="p-2 -m-2 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-zinc-800">
                    <svg className={`w-5 h-5 transition-transform ${expandedUserId === user._id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                </td>
                <td className="p-4 font-medium text-zinc-100">{user.name}</td>
                <td className="hidden md:table-cell p-4 text-zinc-400">{user.email}</td>
                <td className="hidden md:table-cell p-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    user.role === 'ADMIN' ? 'bg-red-500/20 text-red-400' :
                    user.role === 'MEMBER' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="hidden md:table-cell p-4">
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <form action={handleRoleChange.bind(null, user._id)} className="flex items-center gap-2">
                      <CustomSelect 
                        name="role" 
                        defaultValue={user.role}
                        options={[
                          { value: 'GUEST', label: 'GUEST (Invitado)' },
                          { value: 'MEMBER', label: 'MEMBER (Miembro)' },
                          { value: 'ADMIN', label: 'ADMIN (Administrador)' },
                        ]}
                      />
                      <button type="submit" className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
                        Guardar
                      </button>
                    </form>
                    
                    {currentUserId !== user._id && currentUserId !== user.email && (
                      <DeleteUserButton userId={user._id} userName={user.name} />
                    )}
                  </div>
                </td>
              </tr>
              
              {expandedUserId === user._id && (
                <tr className="md:hidden bg-zinc-800/20">
                  <td colSpan={5} className="p-4 border-t border-zinc-800/50">
                    <div className="flex flex-col gap-4">
                      <div>
                        <span className="text-xs text-zinc-500 uppercase font-semibold">Correo:</span>
                        <p className="text-zinc-300 mt-1">{user.email}</p>
                      </div>
                      
                      <div className="border-t border-zinc-700/50 pt-3">
                        <span className="text-xs text-zinc-500 uppercase font-semibold mb-2 block">Cambiar Rol:</span>
                        <form action={handleRoleChange.bind(null, user._id)} className="flex flex-col gap-2">
                          <CustomSelect 
                            name="role" 
                            defaultValue={user.role}
                            options={[
                              { value: 'GUEST', label: 'GUEST (Invitado)' },
                              { value: 'MEMBER', label: 'MEMBER (Miembro)' },
                              { value: 'ADMIN', label: 'ADMIN (Administrador)' },
                            ]}
                          />
                          <button type="submit" className="w-full py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
                            Guardar Rol
                          </button>
                        </form>
                      </div>
                      
                      {currentUserId !== user._id && currentUserId !== user.email && (
                        <div className="border-t border-zinc-700/50 pt-3 flex justify-between items-center">
                          <span className="text-xs text-zinc-500 uppercase font-semibold">Eliminar:</span>
                          <DeleteUserButton userId={user._id} userName={user.name} />
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
