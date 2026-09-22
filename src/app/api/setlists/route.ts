import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Setlist from '@/models/Setlist';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const setlists = await Setlist.find().sort({ date: 1 }).populate('songs.song');
    return NextResponse.json({ success: true, data: setlists });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role === 'GUEST') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    const newSetlist = await Setlist.create({
      ...body,
      createdBy: (session.user as any).id,
    });
    return NextResponse.json({ success: true, data: newSetlist }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}