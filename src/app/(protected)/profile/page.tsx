export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import ProfileForm from './ProfileForm';
import RoleForm from './RoleForm';
import ColorForm from './ColorForm';
import { DEFAULT_USER_COLOR } from '@/lib/userColors';
import InEarForm from './InEarForm';
import PushNotificationManager from '@/components/PushNotificationManager';
import MobileLogoutButton from './MobileLogoutButton';
import NotificationPrefsForm from './NotificationPrefsForm';
import { notificationTypesFor } from '@/lib/notificationPrefs';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  
  await dbConnect();
  const user = await User.findOne({ email: session?.user?.email }).lean();
  
  if (!user) return <div>Usuario no encontrado</div>;

  // Colores que ya eligieron otras personas (color → primer nombre)
  const takenColors: Record<string, string> = {};
  if (user.role !== 'GUEST') {
    const others = await User.find({ _id: { $ne: user._id }, roleColor: { $nin: [DEFAULT_USER_COLOR, null] } }).select('name roleColor').lean();
    for (const other of others) takenColors[other.roleColor] = other.name.trim().split(/\s+/)[0];
  }

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
          />
        </div>

        <div className="space-y-6">
          {user.role !== 'GUEST' && (
            <div className="bg-zinc-900/60 backdrop-blur border border-zinc-700/50 rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-4 text-pink-400">Mi color</h3>
              <ColorForm initialColor={user.roleColor || DEFAULT_USER_COLOR} takenBy={takenColors} />
            </div>
          )}

          {user.role !== 'GUEST' && (
            <div className="bg-zinc-900/60 backdrop-blur border border-zinc-700/50 rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-4 text-emerald-400">Rol</h3>
              <RoleForm
                initialSetListRoleStatus={user.setListRoleStatus || 'NONE'}
              />
            </div>
          )}

          {user.role !== 'GUEST' && (
            <div className="bg-zinc-900/60 backdrop-blur border border-zinc-700/50 rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-4 text-sky-400">In-Ears</h3>
              <InEarForm
                initialFlags={{
                  isVocalist: !!user.isVocalist,
                  instruments: user.instruments || [],
                  isSoundEngineer: !!user.isSoundEngineer,
                }}
              />
            </div>
          )}

          <div className="bg-zinc-900/60 backdrop-blur border border-zinc-700/50 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-purple-400">Preferencias de Notificaciones</h3>
            <div className="space-y-4">
              <PushNotificationManager allowDisable />
              <NotificationPrefsForm
                types={notificationTypesFor(user).map(t => t.key)}
                initialPrefs={JSON.parse(JSON.stringify(user.notificationPrefs ?? {}))}
              />
            </div>
          </div>

          <div className="bg-zinc-900/60 backdrop-blur border border-zinc-700/50 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-zinc-300">Resumen de Cuenta</h3>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><strong className="text-zinc-300">Tipo de cuenta:</strong> {user.role}</li>
              <li><strong className="text-zinc-300">Fecha de registro:</strong> {new Date(user.createdAt).toLocaleDateString('es')}</li>
            </ul>
          </div>
        </div>
      </div>

      <MobileLogoutButton />
    </div>
  );
}
