export const dynamic = 'force-dynamic';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Setlist from '@/models/Setlist';
import '@/models/Song';
import '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import webpush from 'web-push';

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:soporte@lavinaband.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const setlist = await Setlist.findById((await params).id)
      .populate('songs.song')
      .populate('attendance.user')
      .populate('createdBy', 'name')
      .populate('collaborators', 'name');
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
    const setlistId = (await params).id;

    const existingSetlist = await Setlist.findById(setlistId);
    if (!existingSetlist) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    const isCreator = existingSetlist.createdBy?.toString() === (session.user as any).id;
    const isCollaborator = existingSetlist.collaborators?.map((c: any) => c.toString()).includes((session.user as any).id);
    const isAdmin = (session.user as any).role === 'ADMIN';
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

    const setlist = await Setlist.findByIdAndUpdate(setlistId, updateData, { new: true, runValidators: true })
      .populate('songs.song')
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
        const payload = JSON.stringify({
          title: '¡Nuevo Colaborador!',
          body: `Te han añadido como colaborador en el setlist: ${existingSetlist.title}`,
          url: `/setlists/${setlistId}`
        });
        
        for (const u of users) {
          if (u.pushSubscriptions && u.pushSubscriptions.length > 0) {
            for (const sub of u.pushSubscriptions) {
              try {
                await webpush.sendNotification(sub, payload);
              } catch (e) {
                console.error('Push error:', e);
              }
            }
          }
        }
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