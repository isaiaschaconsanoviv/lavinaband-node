"use server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from "next/cache";

export async function updateUserRole(userId: string, newRole: string) {
  const session = await getServerSession(authOptions);
  
  if ((session?.user as any)?.role !== 'ADMIN') {
    throw new Error("No tienes permisos para realizar esta acción");
  }

  await dbConnect();
  await User.findByIdAndUpdate(userId, { role: newRole });
  revalidatePath('/users');
}