import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Setlist from '@/models/Setlist';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import WeeklyReadingCard from '@/components/WeeklyReadingCard';
import BulletinBoardCard from '@/components/BulletinBoardCard';
import Setting from '@/models/Setting';
import Announcement from '@/models/Announcement';
import '@/models/User';
import PushNotificationManager from '@/components/PushNotificationManager';


export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userName = session?.user?.name || 'Músico';
  const role = (session?.user as any)?.role;

  await dbConnect();
  
  // Find next rehearsal (where rehearsalDate >= today)
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const nextSetlistWithRehearsal = await Setlist.findOne({ 
    rehearsalDate: { $gte: today } 
  }).sort({ rehearsalDate: 1 }).lean();



  const readingSetting = await Setting.findOne({ key: 'weeklyReading' }).lean();
  const weeklyReading = readingSetting?.value || '';

  const announcementsData = await Announcement.find().sort({ date: -1 }).lean();
  const bulletinAnnouncements = JSON.parse(JSON.stringify(announcementsData)).map((a: any) => ({
    ...a,
    id: a._id
  }));


  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl font-bold">Resumen General</h1>
        <p className="text-zinc-400 mt-2">
          Bienvenido de nuevo, <span className="text-blue-400">{userName}</span>.
        </p>
      </header>

      {role === 'GUEST' && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-lg">
          <strong>Aviso:</strong> Tu cuenta está en modo invitado. No podrás ver información sensible hasta que un administrador apruebe tu acceso.
        </div>
      )}

      <PushNotificationManager hideWhenSubscribed={true} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Próximo Ensayo */}
        <div className="bg-zinc-900/60 backdrop-blur border border-zinc-700/50 rounded-xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-purple-400">Próximo Ensayo</h3>
            {nextSetlistWithRehearsal && nextSetlistWithRehearsal.rehearsalDate ? (
              <div>
                <p className="text-2xl font-bold text-white mb-1">
                  {format(new Date(nextSetlistWithRehearsal.rehearsalDate), "EEEE d 'de' MMMM", { locale: es })}
                </p>
                <p className="text-zinc-400 text-sm">Para: {nextSetlistWithRehearsal.title}</p>
              </div>
            ) : (
              <p className="text-zinc-300 text-sm">Aún no hay ensayos programados.</p>
            )}
          </div>
          {nextSetlistWithRehearsal && (
            <Link href={`/setlists/${nextSetlistWithRehearsal._id.toString()}`} className="mt-4 inline-block text-sm text-purple-400 hover:text-purple-300">
              Ver detalles &rarr;
            </Link>
          )}
        </div>



        {/* Lectura Semanal */}
        <WeeklyReadingCard initialReading={weeklyReading} role={role} />
        
        {/* Tablón de Anuncios */}
        <BulletinBoardCard initialAnnouncements={bulletinAnnouncements} role={role} userName={userName} />
      </div>
    </div>
  );
}