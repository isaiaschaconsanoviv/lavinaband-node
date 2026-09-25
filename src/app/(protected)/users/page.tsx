import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from "next/navigation";
import UsersTable from "./UsersTable";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const currentUserId = (session?.user as any)?.id || session?.user?.email;

  // Protect route
  if (role !== 'ADMIN') {
    redirect('/dashboard');
  }

  await dbConnect();
  const users = await User.find({}).sort({ createdAt: -1 }).lean();
  
  // Serializar los usuarios para pasarlos al Client Component
  const serializedUsers = users.map(u => ({
    ...u,
    _id: u._id.toString(),
  }));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
        <p className="text-zinc-400 mt-1">Administra los permisos y accesos de los integrantes</p>
      </header>

      <UsersTable users={serializedUsers} currentUserId={currentUserId} />
    </div>
  );
}