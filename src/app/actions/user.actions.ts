"use server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from "next/cache";
import { INSTRUMENTS } from "@/lib/inEars";

export async function updateUserRole(userId: string, newRole: string) {
  const session = await getServerSession(authOptions);
  
  if ((session?.user as any)?.role !== 'ADMIN') {
    throw new Error("No tienes permisos para realizar esta acción");
  }

  await dbConnect();
  await User.findByIdAndUpdate(userId, { role: newRole });
  revalidatePath('/users');
}

export async function deleteUser(userId: string) {
  const session = await getServerSession(authOptions);
  
  if ((session?.user as any)?.role !== 'ADMIN') {
    throw new Error("No tienes permisos para realizar esta acción");
  }

  await dbConnect();
  
  // No permitir que el usuario se elimine a sí mismo
  if ((session?.user as any)?.id === userId || session?.user?.email === (await User.findById(userId))?.email) {
      throw new Error("No puedes eliminar tu propia cuenta");
  }

  await User.findByIdAndDelete(userId);
  revalidatePath('/users');
}

export async function updateUserInEarFlags(userId: string, flags: { isVocalist: boolean; instruments: string[]; isSoundEngineer: boolean }) {
  const session = await getServerSession(authOptions);

  if ((session?.user as any)?.role !== 'ADMIN') {
    throw new Error("No tienes permisos para realizar esta acción");
  }

  await dbConnect();
  await User.findByIdAndUpdate(userId, {
    isVocalist: !!flags.isVocalist,
    instruments: INSTRUMENTS.filter(i => flags.instruments?.includes(i)),
    isSoundEngineer: !!flags.isSoundEngineer,
  });
  revalidatePath('/users');
  revalidatePath('/in-ears');
}
