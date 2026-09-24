'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import RoleSettings from '@/models/RoleSettings';
import RoleAssignment from '@/models/RoleAssignment';
import { revalidatePath } from 'next/cache';
import webpush from 'web-push';

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:test@example.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

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

async function generateFutureWeeks() {
  // Find approved users
  const users = await User.find({ setListRoleStatus: 'APPROVED' }).sort({ createdAt: 1 });
  if (users.length === 0) return;

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
  
  let currentWeekStart = new Date();
  // Get current week's Monday
  currentWeekStart.setHours(0, 0, 0, 0);
  currentWeekStart.setDate(currentWeekStart.getDate() - (currentWeekStart.getDay() || 7) + 1);

  if (latestAssignment && latestAssignment.weekOf > currentWeekStart) {
    currentWeekStart = new Date(latestAssignment.weekOf);
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }

  // Generate for next 4 weeks if they don't exist
  for (let i = 0; i < 4; i++) {
    const weekOf = new Date(currentWeekStart);
    weekOf.setDate(weekOf.getDate() + (i * 7));

    const existing = await RoleAssignment.findOne({ weekOf });
    if (!existing) {
      const thursdayDate = new Date(weekOf);
      thursdayDate.setDate(thursdayDate.getDate() + 3); // Thursday
      
      const sundayDate = new Date(weekOf);
      sundayDate.setDate(sundayDate.getDate() + 6); // Sunday

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
  
  // Get current week's Monday
  let currentWeekStart = new Date();
  currentWeekStart.setHours(0, 0, 0, 0);
  currentWeekStart.setDate(currentWeekStart.getDate() - (currentWeekStart.getDay() || 7) + 1);

  // Delete all assignments from current week onwards
  await RoleAssignment.deleteMany({ weekOf: { $gte: currentWeekStart } });
  
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
  const payload = JSON.stringify({
    title: 'Turno Confirmado',
    body: `${user.name} ha confirmado de enterado su turno para el Rol de Set Lists de esta semana.`,
    url: '/setlist-roles'
  });
  
  for (const admin of admins) {
    if (admin.pushSubscriptions && admin.pushSubscriptions.length > 0) {
      for (const sub of admin.pushSubscriptions) {
        try {
          await webpush.sendNotification(sub, payload);
        } catch (err) {
          console.error('Push error:', err);
        }
      }
    }
  }

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
  if (newUser && newUser.pushSubscriptions && newUser.pushSubscriptions.length > 0) {
    const payload = JSON.stringify({
      title: 'Nuevo Turno Asignado',
      body: `Se te ha asignado un turno para el Rol de Set Lists. Por favor, entra a la app para confirmarlo.`,
      url: '/setlist-roles'
    });
    for (const sub of newUser.pushSubscriptions) {
      try {
        await webpush.sendNotification(sub, payload);
      } catch (err) {
        console.error('Push error:', err);
      }
    }
  }

  revalidatePath('/setlist-roles');
  revalidatePath('/dashboard');
}
