export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Song from '@/models/Song';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import User from '@/models/User'; // Needed for population if not already loaded

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    const suggestions = await Song.find({ status: 'SUGGESTED' })
      .populate('suggestedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();
      
    return NextResponse.json({ success: true, data: suggestions });
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}
