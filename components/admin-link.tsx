'use client';

import Link from 'next/link';
import { Shield } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';

export function AdminLink() {
  const { data: stats } = trpc.user.stats.useQuery();
  
  // Only show for admin users
  if (!stats || stats.role !== 'admin') {
    return null;
  }

  return (
    <Link
      href="/admin"
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-800 hover:text-white text-gray-400 border border-purple-500/30 bg-purple-500/10"
    >
      <Shield className="h-4 w-4" />
      Admin Panel
    </Link>
  );
}