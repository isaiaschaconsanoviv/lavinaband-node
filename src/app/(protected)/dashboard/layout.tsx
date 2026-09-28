import { redirectGuests } from '@/lib/guards';

export default async function GuestRestrictedLayout({ children }: { children: React.ReactNode }) {
  await redirectGuests();
  return children;
}
