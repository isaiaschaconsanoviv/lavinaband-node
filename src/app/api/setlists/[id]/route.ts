export const dynamic = 'force-dynamic';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Setlist from '@/models/Setlist';
import '@/models/Song';
import '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rejectGuests } from '@/lib/guards';
import { canSeeSetlist } from '@/lib/setlists';
import { sendPush } from '@/lib/push';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const denied = await rejectGuests();
    if (denied) return denied;
    const session = await getServerSession(authOptions);
    await dbConnect();
    const setlist = await Setlist.findById((await params).id)
      .populate('songs.song')
      .populate('songs.singers', 'name roleColor')
      .populate('attendance.user')
      .populate('createdBy', 'name')
      .populate('collaborators', 'name');
    if (!setlist || !canSeeSetlist(setlist, (session?.user as any)?.id, (session?.user as any)?.role === 'ADMIN')) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
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
    // El estado "listo" solo cambia con POST /api/setlists/[id]/ready (que notifica a la banda)
    const { isReady, readyAt, ...body } = await req.json();
    const setlistId = (await params).id;

    const existingSetlist = await Setlist.findById(setlistId);
    const isAdmin = (session.user as any).role === 'ADMIN';
    if (!existingSetlist || !canSeeSetlist(existingSetlist, (session.user as any).id, isAdmin)) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const isCreator = existingSetlist.createdBy?.toString() === (session.user as any).id;
    const isCollaborator = existingSetlist.collaborators?.map((c: any) => c.toString()).includes((session.user as any).id);
    const canEdit = isCreator || isAdmin || isCollaborator;

    let updateData = body;
    // Si no tiene permisos para editar la estructura, solo le permitimos actualizar la asistencia
    if (!canEdit) {
      if (body.attendance) {
        updateData = { attendance: body.attendance };
      } else {
        return NextResponse.json({ success: false, error: 'Unauthorized to modify setlist' }, { status: 401 });
      }
    }

    // Quién canta cada canción: solo miembros marcados como voz. Se conservan los que
    // ya estaban asignados a esa canción aunque después los hayan desmarcado.
    if (Array.isArray(updateData.songs)) {
      const refId = (ref: any) => String(ref?._id ?? ref);
      const previous = new Map<string, Set<string>>(
        (existingSetlist.songs || []).map((s: any) => [refId(s.song), new Set<string>((s.singers || []).map(refId))])
      );
      updateData.songs = updateData.songs.map((s: any) => ({
        ...s,
        singers: [...new Set<string>((s.singers || []).map(refId))],
      }));
      const requested = [...new Set<string>(updateData.songs.flatMap((s: any) => s.singers))];
      if (requested.some(id => !mongoose.isValidObjectId(id))) {
        return NextResponse.json({ success: false, error: 'Cantante inválido' }, { status: 400 });
      }
      const vocalists = await mongoose.models.User.find({ _id: { $in: requested }, isVocalist: true }).select('_id').lean();
      const vocalistIds = new Set(vocalists.map((u: any) => u._id.toString()));
      const invalid = updateData.songs.some((s: any) =>
        s.singers.some((id: string) => !vocalistIds.has(id) && !previous.get(refId(s.song))?.has(id))
      );
      if (invalid) {
        return NextResponse.json({ success: false, error: 'Solo se pueden asignar miembros marcados como voz' }, { status: 400 });
      }
    }

    const setlist = await Setlist.findByIdAndUpdate(setlistId, updateData, { new: true, runValidators: true })
      .populate('songs.song')
      .populate('songs.singers', 'name roleColor')
      .populate('attendance.user')
      .populate('createdBy', 'name')
      .populate('collaborators', 'name');
      
    // Send push notifications to newly added collaborators
    if (updateData.collaborators) {
      const oldCollabs = existingSetlist.collaborators?.map((c: any) => c.toString()) || [];
      const newCollabs = updateData.collaborators;
      const addedCollabs = newCollabs.filter((id: string) => !oldCollabs.includes(id));
      
      if (addedCollabs.length > 0) {
        const users = await mongoose.models.User.find({ _id: { $in: addedCollabs } });
        await sendPush('setlistCollaborator', users, {
          title: '¡Nuevo Colaborador!',
          body: `Te han añadido como colaborador en el setlist: ${existingSetlist.title}`,
          url: `/setlists/${setlistId}`
        });
      }
    }
    
    return NextResponse.json({ success: true, data: setlist });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as any).message || 'Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role === 'GUEST') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const setlistId = (await params).id;
    
    const existingSetlist = await Setlist.findById(setlistId);
    if (!existingSetlist) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    const isCreator = existingSetlist.createdBy?.toString() === (session.user as any).id;
    const isAdmin = (session.user as any).role === 'ADMIN';

    if (!isCreator && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized to delete setlist' }, { status: 401 });
    }

    await Setlist.findByIdAndDelete(setlistId);
    
    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as any).message || 'Server Error' }, { status: 500 });
  }
}