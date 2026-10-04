export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { sendPush } from '@/lib/push';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import InEarMix from '@/models/InEarMix';
import InEarChange from '@/models/InEarChange';
import { getInEarActor, loadBandMembers, loadMix, markLevelsApplied } from '@/lib/inEarsServer';
import { MASTER_CHANNEL, buildChannels, clampLevel, formatStepChange, isPerformer } from '@/lib/inEars';


type Params = { params: Promise<{ ownerId: string }> };

// Valida la sesión y que el usuario pueda acceder a la mezcla de `ownerId`
async function authorize(ownerId: string) {
  const actor = await getInEarActor();
  if (!actor) return { error: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }) };
  if (!mongoose.isValidObjectId(ownerId)) {
    return { error: NextResponse.json({ success: false, error: 'Not found' }, { status: 404 }) };
  }
  if (ownerId !== actor.id && !actor.canManage) {
    return { error: NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 }) };
  }

  const members = await loadBandMembers();
  const owner = members.find(m => m._id === ownerId);
  if (!owner || !isPerformer(owner)) {
    return { error: NextResponse.json({ success: false, error: 'Este usuario no tiene mezcla personal' }, { status: 404 }) };
  }
  return { actor, owner, members };
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { ownerId } = await params;
  const auth = await authorize(ownerId);
  if (auth.error) return auth.error;

  return NextResponse.json({ success: true, data: await loadMix(ownerId) });
}

// Guarda niveles y/o el orden de los canales. Si el dueño cambió su propia
// mezcla, se registra en el historial y se notifica a los ingenieros de audio.
async function saveMix(req: NextRequest, { params }: Params) {
  try {
    const { ownerId } = await params;
    const auth = await authorize(ownerId);
    if (auth.error) return auth.error;
    const { actor, owner, members } = auth;

    const body = await req.json();
    const channels = buildChannels(members);
    const labels = new Map(channels.map(c => [c.id, c.label]));
    labels.set(MASTER_CHANNEL, 'Volumen general');

    await dbConnect();
    const mix = await InEarMix.findOne({ owner: ownerId }).lean<{ levels?: Record<string, number>; appliedLevels?: Record<string, number> }>();
    const currentLevels: Record<string, number> = mix?.levels ?? {};
    const isOwnMix = actor.id === ownerId;
    const update: Record<string, unknown> = {};
    const changes: { channel: string; label: string; from: number; to: number }[] = [];

    if (body.levels && typeof body.levels === 'object') {
      for (const [channel, raw] of Object.entries(body.levels)) {
        if (!labels.has(channel) || typeof raw !== 'number' || Number.isNaN(raw)) continue;
        const to = clampLevel(raw);
        const from = currentLevels[channel] ?? 0;
        if (to === from) continue;
        update[`levels.${channel}`] = to;
        changes.push({ channel, label: labels.get(channel)!, from, to });
      }
    }

    if (Array.isArray(body.order)) {
      update.order = body.order.filter((id: unknown) => typeof id === 'string' && labels.has(id) && id !== MASTER_CHANNEL);
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ success: true, data: { changes: [] } });
    }

    // El primer cambio propio fija lo aplicado hasta ahora (antes todo se consideraba
    // aplicado), para que lo nuevo quede pendiente hasta que el ingeniero lo aplique
    if (isOwnMix && changes.length > 0 && !mix?.appliedLevels) {
      update.appliedLevels = { ...currentLevels };
    }

    await InEarMix.updateOne({ owner: ownerId }, { $set: update }, { upsert: true });

    if (changes.length > 0) {
      // Lo que mueve un ingeniero (o admin) en la mezcla de otro ya está en la consola:
      // queda aplicado de una vez
      await InEarChange.create({
        mix: ownerId,
        changedBy: actor.id,
        changes,
        ...(isOwnMix ? {} : { appliedAt: new Date(), appliedBy: actor.id }),
      });
      if (!isOwnMix) {
        await markLevelsApplied(ownerId, Object.fromEntries(changes.map(c => [c.channel, c.to])));
      }

      // Los ajustes que hace un ingeniero en la mezcla de otro no se notifican
      if (isOwnMix) {
        const engineers = await User.find({ isSoundEngineer: true, _id: { $ne: actor.id } }).select('pushSubscriptions notificationPrefs');
        await sendPush('inEars', engineers, {
          title: `🎧 In-Ears · ${owner.name}`,
          // En cuadritos del medidor (no en dB) para que el cambio sea fácil de ubicar en la consola
          body: changes.map(c => `${c.label}: ${formatStepChange(c.from, c.to)}`).join('\n'),
          url: '/in-ears'
        });
      }
    }

    return NextResponse.json({ success: true, data: { changes } });
  } catch (error) {
    console.error('In-Ears save error:', error);
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}

export const PUT = saveMix;
// POST para `navigator.sendBeacon`, que envía los cambios pendientes al cerrar la página
export const POST = saveMix;
