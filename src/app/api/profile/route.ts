import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Announcement from '@/models/Announcement';
import bcrypt from 'bcryptjs';
import { sendPush } from '@/lib/push';
import { INSTRUMENTS } from '@/lib/inEars';
import { DEFAULT_USER_COLOR, isUserColor } from '@/lib/userColors';


export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    const { name, email, currentPassword, newPassword, roleColor, requestSetListRole, optOutSetListRole, isVocalist, instruments, isSoundEngineer } = data;

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updates: any = {};

    // Los invitados no pueden participar en el Rol de Set Lists
    if (requestSetListRole && user.role !== 'GUEST') {
      updates.setListRoleStatus = 'PENDING';
      
      // Notify admins
      const admins = await User.find({ role: 'ADMIN' });
      await sendPush('roleRequests', admins, {
        title: 'Nueva Solicitud de Rol',
        body: `${user.name} ha solicitado unirse al rol de Set Lists.`,
        url: '/setlist-roles'
      });
    } else if (optOutSetListRole) {
      updates.setListRoleStatus = 'NONE';
    }


    // Update basic fields
    if (name && name !== user.name) {
      const oldName = user.name;
      updates.name = name;
      await Announcement.updateMany({ author: oldName }, { author: name });
    }
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
      }
      updates.email = email;
    }
    // "Mi color": solo miembros, solo colores de la paleta y sin repetir (el gris por defecto sí se repite)
    if (roleColor && roleColor !== user.roleColor && user.role !== 'GUEST') {
      if (!isUserColor(roleColor)) {
        return NextResponse.json({ error: 'Color no válido' }, { status: 400 });
      }
      if (roleColor !== DEFAULT_USER_COLOR) {
        const owner = await User.findOne({ _id: { $ne: user._id }, roleColor }).select('name').lean<{ name: string }>();
        if (owner) {
          const takenBy = owner.name.trim().split(/\s+/)[0];
          return NextResponse.json({ error: `Ese color ya es de ${takenBy}`, takenBy }, { status: 409 });
        }
      }
      updates.roleColor = roleColor;
    }

    // Marcas de In-Ears (los invitados no participan)
    if (user.role !== 'GUEST') {
      if (typeof isVocalist === 'boolean') updates.isVocalist = isVocalist;
      if (typeof isSoundEngineer === 'boolean') updates.isSoundEngineer = isSoundEngineer;
      if (Array.isArray(instruments)) {
        updates.instruments = INSTRUMENTS.filter(i => instruments.includes(i));
      }
    }

    // Password update logic
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password required to set new password' }, { status: 400 });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
      }
      updates.password = await bcrypt.hash(newPassword, 10);
    }

    if (Object.keys(updates).length > 0) {
      await User.updateOne({ _id: user._id }, { $set: updates });
    }

    revalidatePath('/dashboard');
    revalidatePath('/profile');
    revalidatePath('/setlist-roles');
    revalidatePath('/in-ears');
    return NextResponse.json({ success: true, message: 'Profile updated' });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


