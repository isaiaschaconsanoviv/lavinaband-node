export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getInEarActor, loadBandMembers, loadMix } from '@/lib/inEarsServer';
import { buildChannels, isPerformer } from '@/lib/inEars';

// Mezcla propia del usuario actual con los canales, para el acceso rápido a In-Ears.
// `data: null` si el usuario no canta ni toca (no tiene mezcla personal).
export async function GET() {
  try {
    const actor = await getInEarActor();
    if (!actor) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const members = await loadBandMembers();
    const me = members.find(m => m._id === actor.id);
    if (!me || !isPerformer(me)) return NextResponse.json({ success: true, data: null });

    return NextResponse.json({
      success: true,
      data: {
        actorId: actor.id,
        name: me.name,
        channels: buildChannels(members),
        mix: await loadMix(actor.id),
      },
    });
  } catch (error) {
    console.error('In-Ears me error:', error);
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}
