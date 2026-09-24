export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Announcement from '@/models/Announcement';
import User from '@/models/User';
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:test@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
  process.env.VAPID_PRIVATE_KEY as string
);

export async function GET() {
  try {
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
      const users = await User.find({ pushSubscriptions: { $exists: true, $not: { $size: 0 } } });
      const payload = JSON.stringify({
        title: 'Nuevo anuncio publicado',
        body: newAnnouncement.title,
        url: `/anuncios/${newAnnouncement._id}`
      });

      for (const user of users) {
        for (const sub of user.pushSubscriptions) {
          try {
            await webpush.sendNotification(sub, payload);
          } catch (err) {}
        }
      }
    } catch (err) {}

    revalidatePath('/dashboard');
    return NextResponse.json(newAnnouncement, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

