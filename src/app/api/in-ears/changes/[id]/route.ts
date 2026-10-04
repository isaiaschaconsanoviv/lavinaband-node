export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import InEarChange from '@/models/InEarChange';
import { getInEarActor, markLevelsApplied } from '@/lib/inEarsServer';

// Marca un cambio como aplicado en la consola (solo ingenieros y admins)
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getInEarActor();
  if (!actor) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  if (!actor.canManage) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

  await dbConnect();
  const change = await InEarChange.findByIdAndUpdate(id, { appliedAt: new Date(), appliedBy: actor.id }, { new: true });
  if (!change) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

  // Los canales del cambio pasan a "aplicado" en la mezcla (verde en la pantalla del
  // miembro), salvo los que ya tienen aplicado un cambio más reciente
  const newerApplied = await InEarChange.find({
    mix: change.mix,
    _id: { $ne: change._id },
    createdAt: { $gt: change.createdAt },
    appliedAt: { $ne: null },
  }).select('changes.channel').lean<{ changes: { channel: string }[] }[]>();
  const supersededChannels = new Set(newerApplied.flatMap(c => c.changes.map(ch => ch.channel)));
  const applied = Object.fromEntries(
    change.changes
      .filter((c: { channel: string }) => !supersededChannels.has(c.channel))
      .map((c: { channel: string; to: number }) => [c.channel, c.to])
  );
  await markLevelsApplied(change.mix.toString(), applied);

  return NextResponse.json({ success: true });
}

// Borra un cambio del historial (solo ingenieros y admins). No modifica la mezcla.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getInEarActor();
  if (!actor) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  if (!actor.canManage) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

  await dbConnect();
  const change = await InEarChange.findByIdAndDelete(id);
  if (!change) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

  return NextResponse.json({ success: true });
}
