export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import InEarChange from '@/models/InEarChange';
import '@/models/User';
import { getInEarActor } from '@/lib/inEarsServer';

// Cambios recientes de las mezclas (solo ingenieros y admins)
export async function GET() {
  const actor = await getInEarActor();
  if (!actor) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  if (!actor.canManage) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

  await dbConnect();
  const changes = await InEarChange.find()
    .sort({ createdAt: -1 })
    .limit(30)
    .populate('mix', 'name')
    .populate('changedBy', 'name')
    .populate('appliedBy', 'name')
    .lean();

  return NextResponse.json({ success: true, data: changes });
}

// Borra todo el historial de cambios (solo ingenieros y admins). No modifica las mezclas.
export async function DELETE() {
  const actor = await getInEarActor();
  if (!actor) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  if (!actor.canManage) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

  await dbConnect();
  const result = await InEarChange.deleteMany({});
  return NextResponse.json({ success: true, data: { deleted: result.deletedCount } });
}
