import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from "next/navigation";
import { updateUserRole } from "@/app/actions/user.actions";
import CustomSelect from '@/components/ui/CustomSelect';

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  // Protect route
  if (role !== 'ADMIN') {
    redirect('/dashboard');
  }

  await dbConnect();
  const users = await User.find({}).sort({ createdAt: -1 }).lean();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
        <p className="text-zinc-400 mt-1">Administra los permisos y accesos de los integrantes</p>
      </header>

      <div className="bg-zinc-900/40 rounded-xl border border-zinc-700/50 overflow-visible">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-900/90 text-zinc-300 text-sm uppercase tracking-wider [&>th:first-child]:rounded-tl-xl [&>th:last-child]:rounded-tr-xl">
              <th className="p-4 font-semibold">Nombre</th>
              <th className="p-4 font-semibold">Correo</th>
              <th className="p-4 font-semibold">Rol Actual</th>
              <th className="p-4 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-700/50">
            {users.map((user: any) => (
              <tr key={user._id.toString()} className="hover:bg-zinc-800/30 transition-colors">
                <td className="p-4 font-medium text-zinc-100">{user.name}</td>
                <td className="p-4 text-zinc-400">{user.email}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    user.role === 'ADMIN' ? 'bg-red-500/20 text-red-400' :
                    user.role === 'MEMBER' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-4">
                  <form action={async (formData: FormData) => {
                    "use server";
                    const newRole = formData.get('role') as string;
                    await updateUserRole(user._id.toString(), newRole);
                  }} className="flex items-center gap-2">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}