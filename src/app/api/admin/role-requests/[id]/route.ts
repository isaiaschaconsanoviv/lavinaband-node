import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import webpush from 'web-push';

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:test@example.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { status } = await req.json(); // 'APPROVED' | 'NONE'
    
    await dbConnect();
    const user = await User.findById((await params).id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    user.setListRoleStatus = status;
    await user.save();

    // Notify the user of the decision
    const payload = JSON.stringify({
      title: 'Respuesta a tu solicitud de Rol',
      body: status === 'APPROVED' 
        ? '¡Tu solicitud para el rol de Set Lists ha sido aprobada!'
        : 'Tu solicitud para el rol de Set Lists fue rechazada.',
      url: '/profile'
    });

    if (user.pushSubscriptions && user.pushSubscriptions.length > 0) {
      for (const sub of user.pushSubscriptions) {
        try {
          await webpush.sendNotification(sub, payload);
        } catch (err) {
          console.error('Push error:', err);
        }
      }
    }

    revalidatePath('/setlist-roles');
    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('Error handling role request:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
