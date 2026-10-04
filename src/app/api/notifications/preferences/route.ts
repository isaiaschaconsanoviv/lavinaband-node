import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { isNotificationType } from '@/lib/notificationPrefs';

// Activa o desactiva un tipo de notificación para la cuenta actual: { type, enabled }
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { type, enabled } = await req.json();
    if (!isNotificationType(type) || typeof enabled !== 'boolean') {
      return NextResponse.json({ success: false, error: 'Invalid preference' }, { status: 400 });
    }

    await dbConnect();
    await User.updateOne({ _id: userId }, { $set: { [`notificationPrefs.${type}`]: enabled } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notification preferences error:', error);
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}
