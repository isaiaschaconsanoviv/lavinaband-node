'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import RoleSettings from '@/models/RoleSettings';
import RoleAssignment from '@/models/RoleAssignment';
import { revalidatePath } from 'next/cache';
import { sendPush } from '@/lib/push';

export async function toggleRoleRotation() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  await dbConnect();
  
  let settings = await RoleSettings.findOne({ singletonId: 'config' });
  if (!settings) {
    settings = new RoleSettings({ singletonId: 'config', isActive: false });
  }

  settings.isActive = !settings.isActive;
  await settings.save();

  if (settings.isActive) {
    await generateFutureWeeks();
  }

  revalidatePath('/setlist-roles');
  return { isActive: settings.isActive };
}

const DAY_MS = 24 * 60 * 60 * 1000;
const BAND_TIMEZONE = 'America/Tijuana';

// La semana del Rol inicia en Domingo: cada turno va de su Domingo (`weekOf` = `sundayDate`)
// al Jueves siguiente. Devuelve el Domingo del próximo turno por iniciar (hoy, si es Domingo)
// como día de calendario (medianoche UTC), según el día de hoy en la zona horaria de la banda.
function upcomingSunday() {
  const todayKey = new Intl.DateTimeFormat('en-CA', { timeZone: BAND_TIMEZONE }).format(new Date());
  const today = new Date(`${todayKey}T00:00:00Z`);
  return new Date(today.getTime() + ((7 - today.getUTCDay()) % 7) * DAY_MS);
}

// Devuelve los usuarios asignados a la semana anterior y a la siguiente de `weekOf`.
// Se usa una ventana de ±1 día para tolerar diferencias de zona horaria al generar.
async function getNeighborAssigneeIds(weekOf: Date) {
  const query: Record<string, unknown> = {
    $or: [-7, 7].map(offset => ({
      weekOf: {
        $gte: new Date(weekOf.getTime() + (offset - 1) * DAY_MS),
        $lte: new Date(weekOf.getTime() + (offset + 1) * DAY_MS)
      }
    }))
  };

  const neighbors = await RoleAssignment.find(query).select('assignedUser').lean();
  return new Set(neighbors.map((n: { assignedUser?: { toString(): string } }) => n.assignedUser?.toString()).filter(Boolean));
}

async function generateFutureWeeks() {
  // Find approved users
  const users = await User.find({ setListRoleStatus: 'APPROVED' }).sort({ createdAt: 1 });
  // Con menos de 2 participantes no se puede evitar que alguien repita semanas seguidas
  if (users.length < 2) return;

  const settings = await RoleSettings.findOne({ singletonId: 'config' });
  let lastAssignedIndex = 0;
  
  if (settings.lastAssignedUser) {
    const idx = users.findIndex(u => u._id.toString() === settings.lastAssignedUser.toString());
    if (idx !== -1) {
      lastAssignedIndex = (idx + 1) % users.length;
    }
  }

  // Find the latest assignment to know where to start generating
  const latestAssignment = await RoleAssignment.findOne().sort({ weekOf: -1 });
  
  let currentWeekStart = upcomingSunday();
  if (latestAssignment && latestAssignment.weekOf > currentWeekStart) {
    currentWeekStart = new Date(latestAssignment.weekOf.getTime() + 7 * DAY_MS);
  }

  // Generate for next 4 weeks if they don't exist
  for (let i = 0; i < 4; i++) {
    const weekOf = new Date(currentWeekStart.getTime() + i * 7 * DAY_MS);

    const existing = await RoleAssignment.findOne({
      weekOf: { $gte: new Date(weekOf.getTime() - DAY_MS), $lte: new Date(weekOf.getTime() + DAY_MS) }
    });
    if (!existing) {
      // Nadie puede tener el rol dos semanas seguidas: saltar a quien tenga la semana vecina
      const neighborIds = await getNeighborAssigneeIds(weekOf);
      let attempts = 0;
      while (neighborIds.has(users[lastAssignedIndex]._id.toString()) && attempts < users.length) {
        lastAssignedIndex = (lastAssignedIndex + 1) % users.length;
        attempts++;
      }
      if (attempts === users.length) continue;

      const sundayDate = new Date(weekOf);
      const thursdayDate = new Date(weekOf.getTime() + 4 * DAY_MS);

      const assignedUser = users[lastAssignedIndex];
      
      await RoleAssignment.create({
        weekOf,
        thursdayDate,
        sundayDate,
        assignedUser: assignedUser._id,
        status: 'PENDING'
      });

      settings.lastAssignedUser = assignedUser._id;
      lastAssignedIndex = (lastAssignedIndex + 1) % users.length;
    }
  }
  
  await settings.save();
}

export async function generateMoreWeeks() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error('Unauthorized');
  
  await dbConnect();
  await generateFutureWeeks();
  revalidatePath('/setlist-roles');
}

export async function resetRoleRotation() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error('Unauthorized');
  
  await dbConnect();
  
  // Borrar los turnos que aún no inician (el turno en curso, ya iniciado en Domingo, se conserva)
  await RoleAssignment.deleteMany({ weekOf: { $gte: upcomingSunday() } });
  
  // Reset pointer
  const settings = await RoleSettings.findOne({ singletonId: 'config' });
  if (settings) {
    settings.lastAssignedUser = undefined;
    await settings.save();
    
    // Regenerate if active
    if (settings.isActive) {
      await generateFutureWeeks();
    }
  }

  revalidatePath('/setlist-roles');
  revalidatePath('/dashboard');
}

export async function confirmRoleAssignment(assignmentId: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) throw new Error('Unauthorized');
  
  await dbConnect();
  
  const user = await User.findOne({ email: session.user.email });
  if (!user) throw new Error('User not found');

  const assignment = await RoleAssignment.findById(assignmentId);
  if (!assignment) throw new Error('Assignment not found');

  if (assignment.assignedUser.toString() !== user._id.toString()) {
    throw new Error('Not authorized to confirm this assignment');
  }

  assignment.status = 'CONFIRMED';
  await assignment.save();

  // Notify admins
  const admins = await User.find({ role: 'ADMIN' });
  await sendPush('turnConfirmed', admins, {
    title: 'Turno Confirmado',
    body: `${user.name} ha confirmado de enterado su turno para el Rol de Set Lists de esta semana.`,
    url: '/setlist-roles'
  });

  revalidatePath('/setlist-roles');
  revalidatePath('/dashboard');
}

export async function changeRoleAssignment(assignmentId: string, newUserId: string) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error('Unauthorized');
  
  await dbConnect();
  
  const assignment = await RoleAssignment.findById(assignmentId);
  if (!assignment) throw new Error('Assignment not found');

  assignment.assignedUser = newUserId;
  assignment.status = 'PENDING'; // reset status
  await assignment.save();

  // Notify the new assigned user
  const newUser = await User.findById(newUserId);
  if (newUser) {
    await sendPush('roleTurns', [newUser], {
      title: 'Nuevo Turno Asignado',
      body: `Se te ha asignado un turno para el Rol de Set Lists. Por favor, entra a la app para confirmarlo.`,
      url: '/setlist-roles'
    });
  }

  revalidatePath('/setlist-roles');
  revalidatePath('/dashboard');
}

export async function deleteRoleAssignment(assignmentId: string) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'ADMIN') throw new Error('Unauthorized');

  await dbConnect();

  const assignment = await RoleAssignment.findByIdAndDelete(assignmentId);
  if (!assignment) throw new Error('Assignment not found');

  revalidatePath('/setlist-roles');
  revalidatePath('/dashboard');
}
