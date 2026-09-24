import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Announcement from '@/models/Announcement';
import bcrypt from 'bcryptjs';
import webpush from 'web-push';

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:test@example.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    const { name, email, currentPassword, newPassword, roleColor, requestSetListRole, optOutSetListRole } = data;

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (requestSetListRole) {
      user.setListRoleStatus = 'PENDING';
      
      // Notify admins
      const admins = await User.find({ role: 'ADMIN' });
      const payload = JSON.stringify({
        title: 'Nueva Solicitud de Rol',
        body: `${user.name} ha solicitado unirse al rol de Set Lists.`,
        url: '/admin'
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
    } else if (optOutSetListRole) {
      user.setListRoleStatus = 'NONE';
    }


    // Update basic fields
    if (name && name !== user.name) {
      const oldName = user.name;
      user.name = name;
      await Announcement.updateMany({ author: oldName }, { author: name });
    }
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
      }
      user.email = email;
    }
    if (roleColor) user.roleColor = roleColor;

    // Password update logic
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password required to set new password' }, { status: 400 });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();
    revalidatePath('/dashboard');
    revalidatePath('/profile');
    revalidatePath('/setlist-roles');
    return NextResponse.json({ success: true, message: 'Profile updated' });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


