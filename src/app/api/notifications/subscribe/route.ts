import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';

// Registra el dispositivo en la cuenta actual. Un dispositivo (endpoint) pertenece a
// una sola cuenta: si antes estaba en otra (otro usuario inició sesión en ese
// celular), se quita de ella para que no le lleguen avisos ajenos.
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await req.json();
    if (!subscription?.endpoint || !subscription?.keys) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    await dbConnect();
    // Quitarlo de cualquier cuenta (incluida la actual, por si cambiaron las llaves) y volver a agregarlo
    await User.updateMany(
      { 'pushSubscriptions.endpoint': subscription.endpoint },
      { $pull: { pushSubscriptions: { endpoint: subscription.endpoint } } }
    );
    const result = await User.updateOne(
      { _id: userId },
      { $push: { pushSubscriptions: { endpoint: subscription.endpoint, expirationTime: subscription.expirationTime ?? null, keys: subscription.keys } } }
    );
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}

// Desvincula el dispositivo de la cuenta actual (al cerrar sesión)
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { endpoint } = await req.json();
    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
    }

    await dbConnect();
    await User.updateOne({ _id: userId }, { $pull: { pushSubscriptions: { endpoint } } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
  }
}
