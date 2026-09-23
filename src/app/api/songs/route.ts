export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Song from '@/models/Song';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
    return NextResponse.json({ success: true, data: song }, { status: 201 });
  } catch (error) {
    console.error("Error creating song suggestion:", error);
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}
