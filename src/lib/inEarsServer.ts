import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import InEarMix from '@/models/InEarMix';
import { buildChannels, type BandMember } from '@/lib/inEars';

export interface InEarActor {
  id: string;
  name: string;
  role: string;
  isSoundEngineer: boolean;
  // Ingenieros y admins pueden ver y mover cualquier mezcla
  canManage: boolean;
}

// Usuario actual con sus permisos para la sección In-Ears (null si no hay sesión o es invitado)
export async function getInEarActor(): Promise<InEarActor | null> {
  const session = await getServerSession(authOptions);
  const id = (session?.user as { id?: string } | undefined)?.id;
  if (!id) return null;

  await dbConnect();
  const user = await User.findById(id).select('name role isSoundEngineer').lean<{ name: string; role: string; isSoundEngineer?: boolean }>();
  if (!user || user.role === 'GUEST') return null;

  return {
    id,
    name: user.name,
    role: user.role,
    isSoundEngineer: !!user.isSoundEngineer,
    canManage: user.role === 'ADMIN' || !!user.isSoundEngineer,
  };
}

// Miembros de la banda con sus marcas (sin invitados)
export async function loadBandMembers(): Promise<BandMember[]> {
  await dbConnect();
  const users = await User.find({ role: { $ne: 'GUEST' } })
    .select('name roleColor isVocalist instruments')
    .sort({ createdAt: 1 })
    .lean<{ _id: { toString(): string }; name: string; roleColor?: string; isVocalist?: boolean; instruments?: string[] }[]>();

  return users.map(u => ({
    _id: u._id.toString(),
    name: u.name,
    roleColor: u.roleColor,
    isVocalist: !!u.isVocalist,
    instruments: u.instruments ?? [],
  }));
}

export async function loadChannels() {
  return buildChannels(await loadBandMembers());
}

export async function loadMix(ownerId: string) {
  await dbConnect();
  const mix = await InEarMix.findOne({ owner: ownerId }).lean<{ levels?: Record<string, number>; appliedLevels?: Record<string, number>; order?: string[] }>();
  const levels = mix?.levels ?? {};
  // Sin `appliedLevels` (mezclas anteriores a esta función) todo se considera aplicado
  return { levels, applied: mix?.appliedLevels ?? levels, order: mix?.order ?? [] };
}

// Marca como aplicados en la consola los niveles indicados de la mezcla de `ownerId`
export async function markLevelsApplied(ownerId: string, levels: Record<string, number>) {
  if (Object.keys(levels).length === 0) return;
  await dbConnect();
  const mix = await InEarMix.findOne({ owner: ownerId }).lean<{ levels?: Record<string, number>; appliedLevels?: Record<string, number> }>();
  if (!mix) return;
  // La primera vez se parte de los niveles actuales (antes todo se consideraba aplicado)
  const applied = { ...(mix.appliedLevels ?? mix.levels ?? {}), ...levels };
  await InEarMix.updateOne({ owner: ownerId }, { $set: { appliedLevels: applied } });
}
