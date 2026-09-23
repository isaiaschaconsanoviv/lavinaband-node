import dbConnect from '@/lib/mongodb';
import Song from '@/models/Song';
import { NextResponse } from 'next/server';

export async function GET() {
  await dbConnect();
  const song = await Song.findOne({ title: /gloria/i });
  return NextResponse.json({ song });
}
