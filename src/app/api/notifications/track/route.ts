import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import NotificationLog from '@/models/NotificationLog';

// El service worker (public/sw.js) reporta qué pasó con una notificación en el dispositivo:
// `received` (llegó y se mostró), `opened` (la tocaron) o `dismissed` (la descartaron).
// No usa sesión (el service worker puede correr con la sesión vencida): se valida con el
// `trackToken` que viaja dentro del push. Solo se guarda la primera vez de cada evento.
const FIELDS = { received: 'receivedAt', opened: 'openedAt', dismissed: 'dismissedAt' } as const;

export async function POST(req: Request) {
  try {
    const { id, token, event } = await req.json();
    const field = FIELDS[event as keyof typeof FIELDS];
    if (!field || typeof token !== 'string' || !mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid' }, { status: 400 });
    }

    await dbConnect();
    const now = new Date();
    // Si la abrieron o descartaron, también llegó (por si se perdió el aviso de `received`)
    const fields = field === 'receivedAt' ? [field] : [field, 'receivedAt'];
    await Promise.all(fields.map(f =>
      NotificationLog.updateOne({ _id: id, token, [f]: { $exists: false } }, { $set: { [f]: now } })
    ));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error al registrar el seguimiento de la notificación:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
