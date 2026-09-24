export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Announcement from '@/models/Announcement';
import '@/models/User';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const announcement = await Announcement.findById((await params).id).populate('reactions.userId', 'name');
    if (!announcement) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(announcement);
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    
    await dbConnect();
    const body = await req.json();
    const updated = await Announcement.findByIdAndUpdate((await params).id, {
      title: body.title,
      text: body.text,
    }, { new: true });
    
    revalidatePath('/dashboard');
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    
    await dbConnect();
    await Announcement.findByIdAndDelete((await params).id);
    revalidatePath('/dashboard');
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

