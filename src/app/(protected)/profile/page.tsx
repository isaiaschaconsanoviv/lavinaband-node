export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import ProfileForm from './ProfileForm';
import PushNotificationManager from '@/components/PushNotificationManager';
import MobileLogoutButton from './MobileLogoutButton';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  
  await dbConnect();
  const user = await User.findOne({ email: session?.user?.email }).lean();
  
  if (!user) return <div>Usuario no encontrado</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <header>
        <h1 className="text-3xl font-bold">Perfil de Usuario</h1>
        <p className="text-zinc-400 mt-2">
          Administra tu información personal y preferencias.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900/60 backdrop-blur border border-zinc-700/50 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-blue-400">Datos y Seguridad</h3>
          <ProfileForm 
            initialName={user.name} 
            initialEmail={user.email} 
            initialRoleColor={user.roleColor || '#71717a'} 
            initialSetListRoleStatus={user.setListRoleStatus || 'NONE'}
          />
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-900/60 backdrop-blur border border-zinc-700/50 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-purple-400">Preferencias de Notificaciones</h3>
            <PushNotificationManager />
          </div>

          <div className="bg-zinc-900/60 backdrop-blur border border-zinc-700/50 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-zinc-300">Resumen de Cuenta</h3>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><strong className="text-zinc-300">Rol:</strong> {user.role}</li>
              <li><strong className="text-zinc-300">Fecha de registro:</strong> {new Date(user.createdAt).toLocaleDateString('es')}</li>
            </ul>
          </div>
        </div>
      </div>

      <MobileLogoutButton />
    </div>
  );
}
