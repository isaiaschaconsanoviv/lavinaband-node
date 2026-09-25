export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import RoleSettings from '@/models/RoleSettings';
import RoleAssignment from '@/models/RoleAssignment';
import PendingRequests from './PendingRequests';
import RoleControls from './RoleControls';
import ConfirmTurnButton from './ConfirmTurnButton';
import ChangeAssigneeButton from './ChangeAssigneeButton';
import CompleteTurnButton from './CompleteTurnButton';

export default async function SetListRolesPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const isAdmin = role === 'ADMIN';

  await dbConnect();
  
  let pendingRequests: any[] = [];
  if (isAdmin) {
    const rawPending = await User.find({ setListRoleStatus: 'PENDING' })
                                 .select('name email roleColor')
                                 .lean();
    pendingRequests = rawPending.map(u => ({ ...u, _id: u._id.toString() }));
  }

  const rawApproved = await User.find({ setListRoleStatus: 'APPROVED' })
                                .select('name roleColor')
                                .lean();
  const approvedUsers = rawApproved.map(u => ({ ...u, _id: u._id.toString() }));

  const settings = await RoleSettings.findOne({ singletonId: 'config' }).lean();
  const isActive = settings?.isActive || false;

  const rawAssignments = await RoleAssignment.find()
    .sort({ weekOf: 1 })
    .populate('assignedUser', 'name email roleColor image')
    .lean();
    
  const assignments = rawAssignments.map(a => ({
    ...a,
    _id: a._id.toString(),
    weekOf: a.weekOf.toISOString(),
    thursdayDate: a.thursdayDate.toISOString(),
    sundayDate: a.sundayDate.toISOString(),
    assignedUser: {
      ...a.assignedUser,
      _id: a.assignedUser._id.toString()
    }
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'COMPLETED': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'SKIPPED': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'Confirmado';
      case 'COMPLETED': return 'Completado';
      case 'SKIPPED': return 'Omitido';
      default: return 'Pendiente de confirmaci&oacute;n';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <header>
        <h1 className="text-3xl font-bold">Rol de Set Lists</h1>
        <p className="text-zinc-400 mt-1">Calendario de rotación para la creación de los Set Lists.</p>
      </header>

      {isAdmin && <PendingRequests initialRequests={pendingRequests} />}

      <div className="bg-zinc-900/60 backdrop-blur border border-zinc-700/50 rounded-xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 border-b border-zinc-800 pb-4 gap-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Calendario de Turnos
          </h3>
          {isAdmin && (
            <RoleControls initialIsActive={isActive} />
          )}
        </div>
        
        {approvedUsers.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            <p>Aún no hay miembros activos en el rol de Set Lists.</p>
            {!isAdmin && <p className="text-sm mt-1">Puedes unirte desde la configuración de tu perfil.</p>}
          </div>
        ) : (
          <div>
            <div className="mb-6 flex flex-wrap gap-2">
              <span className="text-sm text-zinc-400 mr-2">Participantes Activos:</span>
              {approvedUsers.map(u => (
                <span key={u._id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border" style={{ borderColor: u.roleColor || '#71717a', backgroundColor: `${u.roleColor || '#71717a'}1A`, color: u.roleColor || '#a1a1aa' }}>
                  {u.name}
                </span>
              ))}
            </div>
            
            {assignments.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
                <p className="text-zinc-500 mb-2">No hay turnos generados aún.</p>
                {isAdmin && <p className="text-sm text-zinc-600">Inicia la rotación para generar las próximas semanas.</p>}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignments.map((assignment: any) => {
                  const weekStart = new Date(assignment.weekOf);
                  const thursday = new Date(assignment.thursdayDate);
                  const startOfTurn = new Date(thursday.getTime() - 6 * 24 * 60 * 60 * 1000); // Viernes anterior
                  const endOfTurn = new Date(thursday.getTime() + 1 * 24 * 60 * 60 * 1000); // Viernes

                  const now = new Date();
                  const isCurrentWeek = now >= startOfTurn && now < endOfTurn;
                  const isPast = now >= endOfTurn;
                  const isAssignedToMe = (session?.user as any)?.id === assignment.assignedUser._id || session?.user?.email === assignment.assignedUser.email;
                  
                  return (
                    <div 
                      key={assignment._id} 
                      className={`relative p-5 rounded-xl border transition-all ${
                        isCurrentWeek 
                          ? 'bg-blue-900/10 border-blue-500/30 shadow-lg shadow-blue-500/5' 
                          : isPast 
                            ? 'bg-zinc-900/30 border-zinc-800 opacity-60' 
                            : 'bg-zinc-900/60 border-zinc-700/50 hover:border-zinc-600'
                      }`}
                    >
                      {isCurrentWeek && (
                        <span className="absolute -top-3 -right-3 px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded-full shadow-lg">
                          Esta Semana
                        </span>
                      )}
                      
                      <p className="text-sm text-zinc-400 mb-4 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        Semana del {weekStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      </p>
                      
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-zinc-200 border-2" style={{ borderColor: assignment.assignedUser.roleColor || '#71717a', backgroundColor: `${assignment.assignedUser.roleColor || '#71717a'}33` }}>
                          {assignment.assignedUser.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-100">{assignment.assignedUser.name}</p>
                          <span 
                            className={`inline-block mt-1 px-2 py-0.5 border rounded-md text-[10px] font-bold uppercase tracking-wider ${getStatusColor(assignment.status)}`}
                            dangerouslySetInnerHTML={{ __html: getStatusLabel(assignment.status) }}
                          />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-zinc-800/60 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-500 font-medium uppercase">Domingo</span>
                          <span className="text-zinc-300 font-semibold">{new Date(assignment.sundayDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-500 font-medium uppercase">Jueves</span>
                          <span className="text-zinc-300 font-semibold">{new Date(assignment.thursdayDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                        </div>
                      </div>

                      {isAssignedToMe && assignment.status === 'PENDING' && (
                        <ConfirmTurnButton assignmentId={assignment._id} />
                      )}

                      {isAssignedToMe && assignment.status === 'CONFIRMED' && (
                        <CompleteTurnButton assignmentId={assignment._id} />
                      )}

                      {isAdmin && (assignment.status === 'PENDING' || assignment.status === 'CONFIRMED') && (
                        <div className="mt-4 pt-4 border-t border-zinc-800/60">
                           <ChangeAssigneeButton 
                             assignmentId={assignment._id} 
                             currentAssigneeId={assignment.assignedUser._id}
                             approvedUsers={approvedUsers}
                           />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
