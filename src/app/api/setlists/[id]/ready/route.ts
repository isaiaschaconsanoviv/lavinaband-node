export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Setlist from '@/models/Setlist';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendPush } from '@/lib/push';

// Marca el set list como listo (solo su creador o un admin): desde ese momento
// lo ve toda la banda y se le notifica por push.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role === 'GUEST') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const setlistId = (await params).id;
    const userId = (session.user as any).id;

    const setlist = await Setlist.findById(setlistId);
    if (!setlist) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    const isCreator = setlist.createdBy?.toString() === userId;
    const isAdmin = (session.user as any).role === 'ADMIN';
    if (!isCreator && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized to mark setlist as ready' }, { status: 401 });
    }
    if (setlist.isReady !== false) {
      return NextResponse.json({ success: false, error: 'El set list ya está marcado como listo' }, { status: 400 });
    }

    setlist.isReady = true;
    setlist.readyAt = new Date();
    await setlist.save();

    // Notificar a toda la banda, incluido quien lo marcó (le sirve de confirmación).
    // Los invitados no ven set lists.
    const recipients = await User.find({ role: { $ne: 'GUEST' } });
    await sendPush('setlistReady', recipients, {
      title: 'Set List Listo',
      body: `${session.user?.name} terminó el set list "${setlist.title}". ¡Pasa a revisarlo!`,
      url: `/setlists/${setlistId}`
    });

    return NextResponse.json({ success: true, data: { isReady: true, readyAt: setlist.readyAt } });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as any).message || 'Server Error' }, { status: 500 });
  }
}
