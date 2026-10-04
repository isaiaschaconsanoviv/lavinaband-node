export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Song from '@/models/Song';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

import User from '@/models/User';
import { sendPush } from '@/lib/push';

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
    if ((session.user as any).role === 'GUEST') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    
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
      
      await sendPush(admins, {
        title: 'Nueva Sugerencia de Canción',
        body: `${session.user?.name} ha sugerido la canción "${body.title}" de ${body.artist}.`,
        url: '/songs?sugerencias=1'
      });
    } catch (e) {
      console.error('Error resolving push notifications for suggestions', e);
    }

    return NextResponse.json({ success: true, data: song }, { status: 201 });
  } catch (error) {
    console.error("Error creating song suggestion:", error);
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}
