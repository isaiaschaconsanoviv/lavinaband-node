export const dynamic = 'force-dynamic';
import mongoose, { type Types } from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import Setlist from '@/models/Setlist';
import LiveSession from '@/models/LiveSession';
import { canSeeSetlist } from '@/lib/setlists';

// Una sesión sin movimiento en este tiempo se considera terminada (presentador que cerró
// la página sin "Terminar"), para que las vistas en vivo bajen el ritmo de consulta.
const STALE_MS = 3 * 60 * 60 * 1000;

interface SetlistAccess {
  isReady?: boolean;
  createdBy?: Types.ObjectId;
  collaborators?: Types.ObjectId[];
  songs?: { song?: Types.ObjectId }[];
}

interface LiveDoc {
  isActive?: boolean;
  song?: Types.ObjectId;
  section?: number;
  blank?: boolean;
  presenterName?: string;
  updatedAt: Date;
}

async function loadContext(params: Promise<{ id: string }>) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string; name?: string } | undefined;
  if (!session || user?.role === 'GUEST') {
    return { error: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }) };
  }
  const id = (await params).id;
  if (!mongoose.isValidObjectId(id)) {
    return { error: NextResponse.json({ success: false, error: 'Not found' }, { status: 404 }) };
  }
  await dbConnect();
  const setlist = await Setlist.findById(id).select('isReady createdBy collaborators songs.song').lean<SetlistAccess>();
  if (!setlist || !canSeeSetlist(setlist, user?.id, user?.role === 'ADMIN')) {
    return { error: NextResponse.json({ success: false, error: 'Not found' }, { status: 404 }) };
  }
  return { id, user, setlist };
}

function toState(live: LiveDoc | null) {
  const isActive = !!live?.isActive && Date.now() - new Date(live.updatedAt).getTime() < STALE_MS;
  return {
    isActive,
    songId: isActive && live.song ? String(live.song) : null,
    section: isActive ? live.section ?? 0 : 0,
    blank: isActive ? !!live.blank : false,
    presenterName: isActive ? live.presenterName ?? null : null,
  };
}

// Lo consultan las vistas en vivo cada segundo: respuesta mínima
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await loadContext(params);
    if (ctx.error) return ctx.error;
    const live = await LiveSession.findOne({ setlist: ctx.id }).select('isActive song section blank presenterName updatedAt').lean<LiveDoc>();
    return NextResponse.json({ success: true, data: toState(live) });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message || 'Server Error' }, { status: 500 });
  }
}

// El presentador mueve la presentación: { songId, section, blank }. Cualquiera que vea el
// set list puede presentar; si otro toma la presentación, queda como presentador.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await loadContext(params);
    if (ctx.error) return ctx.error;

    const { songId, section, blank } = await req.json();
    const inSetlist = (ctx.setlist.songs || []).some(s => String(s.song) === String(songId));
    if (!inSetlist || !Number.isInteger(section) || section < 0) {
      return NextResponse.json({ success: false, error: 'Parte inválida' }, { status: 400 });
    }

    const live = await LiveSession.findOneAndUpdate(
      { setlist: ctx.id },
      {
        presenter: ctx.user?.id,
        presenterName: ctx.user?.name,
        song: songId,
        section,
        blank: !!blank,
        isActive: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean<LiveDoc>();
    return NextResponse.json({ success: true, data: toState(live) });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message || 'Server Error' }, { status: 500 });
  }
}

// Terminar la presentación
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await loadContext(params);
    if (ctx.error) return ctx.error;
    await LiveSession.updateOne({ setlist: ctx.id }, { isActive: false, blank: false });
    return NextResponse.json({ success: true, data: toState(null) });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message || 'Server Error' }, { status: 500 });
  }
}
