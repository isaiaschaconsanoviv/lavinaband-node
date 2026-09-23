import dbConnect from '@/lib/mongodb';
import Song from '@/models/Song';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import SongsClient from './SongsClient';

export default async function RepertoryPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  await dbConnect();
  
  // Only show active and approved songs in the main repertory list
  const songs = await Song.find({ status: { $in: ['ACTIVE', 'APPROVED'] } }).sort({ title: 1 }).lean();

  // Convert ObjectIds to strings to pass to Client Component safely
  const serializedSongs = songs.map((s: any) => ({
    ...s,
    _id: s._id.toString(),
    suggestedBy: s.suggestedBy?.toString(),
    createdAt: s.createdAt?.toString(),
    updatedAt: s.updatedAt?.toString()
  }));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SongsClient initialSongs={serializedSongs} role={role} />
    </div>
  );
}
