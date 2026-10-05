export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Setlist from '@/models/Setlist';
import '@/models/Song';
import '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rejectGuests } from '@/lib/guards';
import { visibleSetlistsFilter } from '@/lib/setlists';

export async function GET(req: NextRequest) {
  try {
    const denied = await rejectGuests();
    if (denied) return denied;
    const session = await getServerSession(authOptions);
    const isAdmin = (session?.user as any)?.role === 'ADMIN';
    await dbConnect();
    const setlists = await Setlist.find(visibleSetlistsFilter((session?.user as any)?.id, isAdmin)).sort({ date: 1 }).populate('songs.song').populate('createdBy', 'name roleColor');
    return NextResponse.json({ success: true, data: setlists });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as any).message || 'Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role === 'GUEST') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { isReady, readyAt, ...body } = await req.json();
    const newSetlist = await Setlist.create({
      ...body,
      isReady: false,
      createdBy: (session.user as any).id,
    });
    return NextResponse.json({ success: true, data: newSetlist }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as any).message || 'Server Error' }, { status: 500 });
  }
}