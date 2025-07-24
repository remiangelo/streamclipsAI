import { auth } from '@clerk/nextjs';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';

export async function requireAdmin() {
  const { userId } = auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { role: true }
  });

  if (!user || user.role !== 'admin') {
    redirect('/dashboard');
  }

  return { userId, isAdmin: true };
}