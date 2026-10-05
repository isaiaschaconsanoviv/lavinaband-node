export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import RoleAssignment from '@/models/RoleAssignment';
import User from '@/models/User';
import { sendPush } from '@/lib/push';

// Recordatorio del Rol de Set Lists: el Lunes antes de su semana (6 días antes del Domingo
// del turno), a las 9:00 am de Tijuana, avisa al encargado. Lo llama Vercel Cron (ver
// vercel.json) los Lunes a las 16:00 y 17:00 UTC; solo envía la llamada que cae a las 9 am o
// después en Tijuana (16:00 UTC en verano, 17:00 UTC en invierno). `reminderSentAt` evita
// que se mande dos veces aunque Vercel repita una llamada.
// Prueba sin enviar nada: GET /api/cron/role-reminder?dryRun=1 con el mismo encabezado.

const BAND_TIMEZONE = 'America/Tijuana';
const DAY_MS = 24 * 60 * 60 * 1000;
const REMINDER_HOUR = 9;

function bandNow() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: BAND_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23', weekday: 'short' })
      .formatToParts(new Date())
      .map(p => [p.type, p.value])
  );
  return { dayKey: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour), weekday: parts.weekday };
}

const shortDate = (date: Date) => date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const dryRun = req.nextUrl.searchParams.get('dryRun') === '1';

  const now = bandNow();
  const isTime = now.weekday === 'Mon' && now.hour >= REMINDER_HOUR;

  // Turnos cuyo Domingo es dentro de 6 días (las fechas del Rol son días de calendario UTC)
  const sundayStart = new Date(new Date(`${now.dayKey}T00:00:00Z`).getTime() + 6 * DAY_MS);
  await dbConnect();
  const pending = await RoleAssignment.find({
    sundayDate: { $gte: sundayStart, $lt: new Date(sundayStart.getTime() + DAY_MS) },
    reminderSentAt: { $exists: false },
  }).lean<{ _id: unknown; assignedUser: unknown; sundayDate: Date; thursdayDate: Date }[]>();

  if (dryRun || !isTime) {
    return NextResponse.json({ success: true, dryRun, isTime, now, wouldNotify: pending.map(a => ({ _id: a._id, assignedUser: a.assignedUser, sundayDate: a.sundayDate })) });
  }

  let sent = 0;
  for (const a of pending) {
    // Apartar el turno antes de enviar, por si Vercel hace dos llamadas al mismo tiempo
    const claimed = await RoleAssignment.findOneAndUpdate(
      { _id: a._id, reminderSentAt: { $exists: false } },
      { $set: { reminderSentAt: new Date() } }
    );
    if (!claimed) continue;
    const user = await User.findById(a.assignedUser);
    if (!user) continue;
    await sendPush('roleReminder', [user], {
      title: 'Tu semana del Rol se acerca',
      body: `Te toca armar los set lists del ${shortDate(a.sundayDate)} y del ${shortDate(a.thursdayDate)}. ¡Prepáralos con tiempo!`,
      url: '/setlists',
    });
    sent++;
  }

  return NextResponse.json({ success: true, sent });
}
