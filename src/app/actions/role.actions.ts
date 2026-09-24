'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import RoleSettings from '@/models/RoleSettings';
import RoleAssignment from '@/models/RoleAssignment';
import { revalidatePath } from 'next/cache';

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
