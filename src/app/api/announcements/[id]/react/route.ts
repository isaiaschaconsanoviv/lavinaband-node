import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Announcement from '@/models/Announcement';
import '@/models/User';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const userId = (session.user as any).id;
    const body = await req.json();
    const type = body.type || 'LIKE';

    await dbConnect();
    const announcement = await Announcement.findById((await params).id);
    if (!announcement) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const existingReactionIndex = announcement.reactions.findIndex((r: any) => r.userId.toString() === userId);
    
    if (existingReactionIndex >= 0) {
      if (announcement.reactions[existingReactionIndex].type === type) {
        // Toggle off
        announcement.reactions.splice(existingReactionIndex, 1);
      } else {
        // Change type
        announcement.reactions[existingReactionIndex].type = type;
      }
    } else {
      // Add new
      announcement.reactions.push({ userId, type });
    }

    await announcement.save();
    revalidatePath('/dashboard');
    return NextResponse.json(announcement);
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

