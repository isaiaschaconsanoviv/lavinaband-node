import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Setting from '@/models/Setting';
import User from '@/models/User';
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:test@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
  process.env.VAPID_PRIVATE_KEY as string
);

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { announcements, isNew, newTitle } = await req.json();

    if (!Array.isArray(announcements)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    await dbConnect();
    
    const updatedSetting = await Setting.findOneAndUpdate(
      { key: 'bulletinBoard' },
      { value: announcements },
      { upsert: true, new: true }
    );

    // Send push notification if it is a new announcement
    if (isNew && newTitle) {
      try {
        const users = await User.find({ pushSubscriptions: { $exists: true, $not: { $size: 0 } } });
        
        const payload = JSON.stringify({
          title: 'Nuevo anuncio publicado',
          body: newTitle,
          url: '/dashboard'
        });

        for (const user of users) {
          for (const sub of user.pushSubscriptions) {
            try {
              await webpush.sendNotification(sub, payload);
            } catch (err) {
              console.error('Error sending push to a subscription:', err);
            }
          }
        }
      } catch (err) {
        console.error('Failed to process push notifications:', err);
      }
    }

    return NextResponse.json(updatedSetting);
  } catch (error) {
    console.error('Error updating bulletin board:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
