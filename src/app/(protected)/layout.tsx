import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Sidebar from '@/components/Sidebar';
import { SIDEBAR_COOKIE } from '@/lib/sidebar';
import PushSubscriptionSync from '@/components/PushSubscriptionSync';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login');
  }

  const sidebarCollapsed = (await cookies()).get(SIDEBAR_COOKIE)?.value === '1';

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-zinc-950 text-zinc-100">
      <PushSubscriptionSync />
      <Sidebar userRole={(session.user as any)?.role} userName={session.user?.name || ''} initialCollapsed={sidebarCollapsed} />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
        {children}
      </main>
    </div>
  );
}
