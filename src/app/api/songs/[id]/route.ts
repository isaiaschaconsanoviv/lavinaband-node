export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Song from '@/models/Song';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const params = await context.params;
    const body = await req.json();
    await dbConnect();

    const updatedSong = await Song.findByIdAndUpdate(params.id, body, { new: true });
    
    if (!updatedSong) {
      return NextResponse.json({ success: false, error: 'Song not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedSong });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}