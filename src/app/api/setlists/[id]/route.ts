export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Setlist from '@/models/Setlist';
import '@/models/Song';
import '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const setlist = await Setlist.findById((await params).id).populate('songs.song').populate('attendance.user');
    if (!setlist) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: setlist });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as any).message || 'Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role === 'GUEST') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    const setlist = await Setlist.findByIdAndUpdate((await params).id, body, { new: true, runValidators: true }).populate('songs.song').populate('attendance.user');
    if (!setlist) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    
    return NextResponse.json({ success: true, data: setlist });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as any).message || 'Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const setlist = await Setlist.findByIdAndDelete((await params).id);
    if (!setlist) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    
    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as any).message || 'Server Error' }, { status: 500 });
  }
}