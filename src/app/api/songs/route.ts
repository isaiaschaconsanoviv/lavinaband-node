export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Song from '@/models/Song';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

import User from '@/models/User';
import webpush from 'web-push';

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:info@lavinaband.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    
    await dbConnect();
    const songs = await Song.find({ status: { $in: ['ACTIVE', 'APPROVED'] } }).sort({ title: 1 });
    return NextResponse.json({ success: true, data: songs });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    
    const body = await req.json();
    
    await dbConnect();
    
    // Asignar el status SUGGESTED y el usuario que lo sugirió
    const newSongData = {
      ...body,
      status: 'SUGGESTED',
      suggestedBy: (session.user as any).id
    };
    
    const song = await Song.create(newSongData);

    try {
      const admins = await User.find({ role: 'ADMIN' });
      
      const payload = JSON.stringify({
        title: 'Nueva Sugerencia de Canción',
        body: `${session.user?.name} ha sugerido la canción "${body.title}" de ${body.artist}.`,
        url: '/songs'
      });
      
      for (const admin of admins) {
        if (admin.pushSubscriptions && admin.pushSubscriptions.length > 0) {
          for (const sub of admin.pushSubscriptions) {
            try {
              await webpush.sendNotification(sub, payload);
            } catch (e) {
              console.error('Error sending push to admin', e);
            }
          }
        }
      }
    } catch (e) {
      console.error('Error resolving push notifications for suggestions', e);
    }

    return NextResponse.json({ success: true, data: song }, { status: 201 });
  } catch (error) {
    console.error("Error creating song suggestion:", error);
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}
