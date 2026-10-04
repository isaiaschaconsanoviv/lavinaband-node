export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rejectGuests } from '@/lib/guards';
import dbConnect from '@/lib/mongodb';
import Announcement from '@/models/Announcement';
import User from '@/models/User';
import { sendPush } from '@/lib/push';

export async function GET() {
  try {
    const denied = await rejectGuests();
    if (denied) return denied;
    await dbConnect();
    const announcements = await Announcement.find().sort({ date: -1 });
    return NextResponse.json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    
    if (!body.title || !body.text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();
    
    const newAnnouncement = await Announcement.create({
      title: body.title,
      text: body.text,
      author: session?.user?.name || 'Administrador',
      date: new Date(),
      reactions: []
    });

    try {
      // A toda la banda, incluido quien lo publicó (le sirve de confirmación).
      // Los invitados no pueden ver anuncios.
      const users = await User.find({
        role: { $ne: 'GUEST' },
        pushSubscriptions: { $exists: true, $not: { $size: 0 } }
      });
      await sendPush('announcements', users, {
        title: 'Nuevo anuncio publicado',
        body: newAnnouncement.title,
        url: `/anuncios/${newAnnouncement._id}`
      });
    } catch (err) {
      console.error('Error al notificar el anuncio:', err);
    }

    revalidatePath('/dashboard');
    return NextResponse.json(newAnnouncement, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

